<template>
    <div :class="{ hidden: hideMainContent }">
        <Splitpanes :horizontal="horizontal">
            <Pane>
                <div ref="editorElement" class="editor-element"></div>
            </Pane>
            <Pane>
                <div ref="sprottyWrapper" class="sprotty-wrapper">
                    <div :id="`sprotty-container-${id}`"></div>
                    <div v-show="errorMessage != undefined" class="modal-mask">
                        <div class="modal-container error">
                            <p class="title">Error</p>
                            <p>{{ errorMessage }}</p>
                        </div>
                    </div>
                    <div v-if="metadata" class="modal-container metadata">
                        <template v-for="[key, value] in Object.entries(metadata)" :key="key">
                            <details v-if="typeof value == 'object'" class="details custom-block">
                                <summary>{{ key }}</summary>
                                <pre>{{ JSON.stringify(value, null, 4) }}</pre>
                            </details>
                            <div v-else class="details custom-block plain">
                                <p>
                                    <spant class="title">{{ key }}</spant
                                    >: {{ value }}
                                </p>
                            </div>
                        </template>
                    </div>
                    <div class="modal-container views">
                        <div class="views-header">
                            <div v-if="showFilterDialog" class="title">Components</div>
                            <IconButton
                                :icon="showFilterDialog ? 'vpi-close' : 'vpi-filter'"
                                label="Filter"
                                @click="showFilterDialog = !showFilterDialog"
                            />
                        </div>
                        <template v-if="showFilterDialog">
                            <div v-for="template in componentTemplates" :key="template" class="template-toggle">
                                <VPSwitch
                                    :class="{ checked: !disabledComponentTemplates.has(template) }"
                                    @click="toggleComponentTemplate(template)"
                                /><span>{{ template }}</span>
                            </div>
                            <div class="title">Relations</div>
                            <div v-for="template in relationTemplates" :key="template" class="template-toggle">
                                <VPSwitch
                                    :class="{ checked: !disabledRelationTemplates.has(template) }"
                                    @click="toggleRelationTemplate(template)"
                                /><span>{{ template }}</span>
                            </div>
                            <div class="title">Misc</div>
                            <div class="template-toggle">
                                <VPSwitch
                                    :class="{ checked: hideDisconnected }"
                                    @click="hideDisconnected = !hideDisconnected"
                                />
                                <span>Hide disconnected</span>
                            </div>
                        </template>
                    </div>
                </div>
            </Pane>
        </Splitpanes>
    </div>
</template>
<script setup lang="ts">
import "reflect-metadata";
// @ts-ignore
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import { ref, onBeforeUnmount, watch, computed, toRaw, watchEffect, PropType } from "vue";
import { TYPES } from "sprotty";
import { RequestBoundsAction } from "sprotty-protocol";
import {
    createContainer,
    CreateRelationContext,
    Graph,
    GraphLayout,
    GraphModelSource,
    SelectedElement,
    ShapeGenerator
} from "@gropius/graph-editor";
import { onMounted } from "vue";
import { MonacoEditorLanguageClientWrapper, UserConfig } from "monaco-editor-wrapper";
import { shallowRef } from "vue";
import { inject } from "vue";
import { Disposable } from "vscode-languageserver-protocol";
import { asyncComputed, refThrottled } from "@vueuse/core";
import { v4 as uuid } from "uuid";
import "@codingame/monaco-vscode-yaml-default-extension";
import { useData } from "vitepress";
import { updateUserConfiguration } from "@codingame/monaco-vscode-configuration-service-override";
import { parseModel } from "../util/parseModel";
import { settingsKey } from "../theme/settings";
import { validateModel } from "../util/validateModel";
import { View } from "../util/view";
import VPSwitch from "vitepress/dist/client/theme-default/components/VPSwitch.vue";
import { filterModel } from "../util/filterModel";
import IconButton from "./IconButton.vue";

const id = uuid();

const props = defineProps({
    horizontal: {
        type: Boolean,
        default: false
    },
    view: {
        type: String as PropType<View>,
        required: true
    }
});

const model = defineModel({
    type: String,
    required: true
});

const editorElement = ref<HTMLElement | null>(null);
const sprottyWrapper = ref<HTMLElement | null>(null);
const disposables = shallowRef<Disposable[]>([]);
const hideMainContent = ref(true);

watch(model, (value) => {
    if (editor.value != undefined && editor.value.getValue() != value) {
        editor.value.setValue(value);
    }
});

const { isDark } = useData();

const colorTheme = computed(() => (isDark.value ? "Default Dark Modern" : "Default Light Modern"));

watch(isDark, () => {
    updateUserConfiguration(JSON.stringify({ "workbench.colorTheme": colorTheme.value }));
});

class ModelSource extends GraphModelSource {
    protected navigateToElement(element: string): void {}
    protected layoutUpdated(partialUpdate: GraphLayout, resultingLayout: GraphLayout): void {}
    protected handleSelectionChanged(selectedElements: SelectedElement<any>[]): void {}
    protected handleCreateRelation(context: CreateRelationContext): void {}
}

const editor = shallowRef<{
    setValue(value: string): void;
    getValue(): string;
}>();
const modelSource = shallowRef<ModelSource | undefined>();

const state = computed(() => {
    try {
        const parsedModel = parseModel(model.value);
        validateModel(parsedModel);
        return { parsedModel, errorMessage: null };
    } catch (e) {
        console.error(e);
        return { parsedModel: undefined, errorMessage: (e as any).message };
    }
});

const parsedModel = computed(() => state.value.parsedModel);
const errorMessage = computed(() => state.value.errorMessage);
const componentTemplates = computed(
    () => new Set(parsedModel.value?.components.map((component) => component.template))
);
const relationTemplates = computed(() => new Set(parsedModel.value?.relations.map((relation) => relation.template)));
const disabledComponentTemplates = ref(new Set<string>());
const disabledRelationTemplates = ref(new Set<string>());
const hideDisconnected = ref(false);
const showFilterDialog = ref(false);

const filteredModel = computed(() => {
    if (parsedModel.value == undefined) {
        return undefined;
    }
    return filterModel(
        parsedModel.value,
        disabledComponentTemplates.value,
        disabledRelationTemplates.value,
        hideDisconnected.value
    );
});

const settings = inject(settingsKey);

const layoutServerUrl = computed(() => settings!.value.serverUrl ?? "");

const throttledFilteredModel = refThrottled(filteredModel, 800, true, true);

const shapeGenerator = new ShapeGenerator();

function enhanceModel(model: Graph, sizes: Map<string, { width: number; height: number }>) {
    for (const component of model.components) {
        enhanceModelElement(component, sizes, false);
        for (const inter of component.interfaces) {
            enhanceModelElement(inter, sizes, true);
        }
    }
    return model;
}

function enhanceModelElement(
    element: any,
    sizes: Map<string, { width: number; height: number }>,
    isInterface: boolean
) {
    let size: { width: number; height: number };
    if (isInterface) {
        size = {
            width: 40,
            height: 40
        };
    } else {
        const nameSize = sizes.get(element.id + "-name");
        const bounds = {
            width: nameSize?.width ?? 0,
            height: nameSize?.height ?? 0,
            x: 0,
            y: 0
        };
        size = shapeGenerator.generateForInnerBounds(element.style.shape, bounds, element.style).bounds;
    }

    element["size"] = { width: size.width, height: size.height };
}

const fetchResult = asyncComputed<{ data: GraphLayout; meta: any }>(
    async () => {
        const modelValue = throttledFilteredModel.value;
        if (modelValue == undefined || layoutServerUrl.value == "" || modelSource.value == undefined) {
            return {};
        }
        const boundsRes = await modelSource.value.actionDispatcher.request(
            RequestBoundsAction.create((modelSource.value as any).createRoot(throttledFilteredModel.value, {}, true))
        );
        const sizesMap = new Map<string, { width: number; height: number }>();
        for (const bound of boundsRes.bounds) {
            sizesMap.set(bound.elementId, bound.newSize);
        }
        const res = await fetch(layoutServerUrl.value, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(enhanceModel(toRaw(modelValue), sizesMap))
        }).then((response) => response.json());
        return res;
    },
    { data: {}, meta: undefined }
);

const layout = computed(() => fetchResult.value.data);
const metadata = computed(() => fetchResult.value.meta);

watchEffect(() => {
    if (layout.value != undefined && modelSource.value != undefined && throttledFilteredModel.value != null) {
        modelSource.value.updateGraph({
            graph: throttledFilteredModel.value,
            layout: layout.value,
            fitToBounds: true
        });
    }
});

function toggleComponentTemplate(template: string) {
    if (disabledComponentTemplates.value.has(template)) {
        disabledComponentTemplates.value.delete(template);
    } else {
        disabledComponentTemplates.value.add(template);
    }
}

function toggleRelationTemplate(template: string) {
    if (disabledRelationTemplates.value.has(template)) {
        disabledRelationTemplates.value.delete(template);
    } else {
        disabledRelationTemplates.value.add(template);
    }
}

onMounted(async () => {
    const wrapper = new MonacoEditorLanguageClientWrapper();
    disposables.value.push(wrapper);
    const userConfig: UserConfig = {
        wrapperConfig: {
            editorAppConfig: {
                $type: "extended",
                codeResources: {
                    main: {
                        text: model.value,
                        uri: "graph.yaml"
                    }
                },
                userConfiguration: {
                    json: JSON.stringify({
                        "workbench.colorTheme": colorTheme.value
                    })
                }
            }
        }
    };

    await wrapper.initAndStart(userConfig, editorElement.value!);
    const monacoEditor = wrapper.getEditor()!;
    editor.value = monacoEditor;
    monacoEditor.onDidChangeModelContent(() => {
        model.value = monacoEditor.getValue();
    });

    hideMainContent.value = false;

    const container = createContainer(`sprotty-container-${id}`);
    container.bind(ModelSource).toSelf().inSingletonScope();
    container.bind(TYPES.ModelSource).toService(ModelSource);
    modelSource.value = container.get(ModelSource);
    const currentModel = parsedModel.value;
    if (currentModel != undefined) {
        modelSource.value!.updateGraph({
            graph: currentModel,
            layout: {},
            fitToBounds: false
        });
        modelSource.value!.updateGraph({
            graph: currentModel,
            layout: {},
            fitToBounds: true
        });
    }
});

onBeforeUnmount(() => {
    disposables.value.forEach((disposable) => {
        try {
            disposable.dispose();
        } catch (e) {}
    });
});
</script>
<style scoped>
.hidden {
    display: none;
}
.editor-element {
    width: 100%;
    height: 100%;
}

.sprotty-wrapper {
    position: relative;
}

.modal-mask {
    position: absolute;
    z-index: 200;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--vp-backdrop-bg-color);
    transition: opacity 0.5s;
}

.modal-container {
    padding: 10px;
    border-radius: 12px;
    transition: all 0.3s ease;
    gap: 8px;
    display: grid;
}

.modal-container.error {
    width: min(calc(100% - 40px), 400px);
    margin: auto;
    background-color: var(--vp-c-danger-3);
    color: var(--vp-c-neutral);
}

.modal-container.metadata,
.modal-container.views {
    position: absolute;
    top: 20px;
    background-color: var(--vp-c-bg-alt);
    color: var(--vp-c-neutral-7);
    white-space: preserve;
    box-shadow: var(--vp-shadow-3);
}

.modal-container.metadata {
    right: 20px;
}

.modal-container.views {
    left: 20px;
}

.views-header {
    display: flex;
    align-items: center;

    .title {
        flex-grow: 1;
    }
}

.modal-container.views .views-header :deep(.icon-button:has(.vpi-close)) {
    width: 20px;
    height: 20px;
}

.custom-block.details {
    padding: 8px;
}

.custom-block.details summary {
    margin: 0;
}

.custom-block.details.plain {
    padding-left: 24px;
}

.title {
    font-weight: 700;
}

.template-toggle {
    display: flex;

    button {
        margin-right: 8px;
    }
}

.VPSwitch.checked :deep(.check) {
    transform: translateX(18px);
}

.VPSwitch.checked {
    background-color: var(--vp-c-brand);
    transition:
        border-color 0.25s,
        background-color 0.4s ease !important;
}
</style>
<style>
.splitpanes {
    height: 100%;
}

.splitpanes__splitter {
    z-index: 5;
    background: transparent;
    transition: background-color 0s 0s;
}

.splitpanes--vertical .splitpanes__splitter {
    margin-left: -2px;
    margin-right: -2px;
    width: 4px;
}

.splitpanes--horizontal .splitpanes__splitter {
    margin-top: -2px;
    margin-bottom: -2px;
    height: 4px;
}

.splitpanes.splitpanes--dragging .splitpanes__splitter,
.splitpanes__splitter:hover {
    transition: background-color 0s 0.25s;
    background: #007fd4;
}

.splitpanes__pane {
    position: relative;
}

.splitpanes__pane:not(:first-of-type)::before {
    content: "";
    display: block;
    background-color: var(--vp-c-gutter);
    position: absolute;
}

.splitpanes--vertical .splitpanes__pane:not(:first-of-type)::before {
    height: 100%;
    width: 1px;
}

.splitpanes--horizontal .splitpanes__pane:not(:first-of-type)::before {
    height: 1px;
    width: 100%;
}
</style>
