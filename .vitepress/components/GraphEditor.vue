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
                        <p>{{ metadata }}</p>
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
import { ref, onBeforeUnmount, watch, computed, toRaw, watchEffect } from "vue";
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
import { asyncComputed, refThrottled, watchImmediate } from "@vueuse/core";
import { v4 as uuid } from "uuid";
import "@codingame/monaco-vscode-yaml-default-extension";
import { useData } from "vitepress";
import { updateUserConfiguration } from "@codingame/monaco-vscode-configuration-service-override";
import { parseModel } from "../util/parseModel";
import { settingsKey } from "../theme/settings";
import { validateModel } from "../util/validateModel";

const id = uuid();

defineProps({
    horizontal: {
        type: Boolean,
        default: false
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

const parsedModel = ref<Graph>();
const errorMessage = ref<string | null>(null);

watchImmediate(model, (value) => {
    try {
        const parsed = parseModel(value);
        validateModel(parsed);
        parsedModel.value = parsed;
        errorMessage.value = null;
    } catch (e) {
        console.error(e);
        errorMessage.value = (e as any).message;
    }
});

const settings = inject(settingsKey);

const layoutServerUrl = computed(() => settings!.value.serverUrl ?? "");

const throttledParsedModel = refThrottled(parsedModel, 800, true, true);

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
        const modelValue = throttledParsedModel.value;
        if (modelValue == undefined || layoutServerUrl.value == "" || modelSource.value == undefined) {
            return {};
        }
        const boundsRes = await modelSource.value.actionDispatcher.request(
            RequestBoundsAction.create((modelSource.value as any).createRoot(throttledParsedModel.value, {}, true))
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
const metadata = computed(() => JSON.stringify(fetchResult.value.meta, null, 4));

watchEffect(() => {
    if (layout.value != undefined && modelSource.value != undefined && throttledParsedModel.value != null) {
        modelSource.value.updateGraph({
            graph: throttledParsedModel.value,
            layout: layout.value,
            fitToBounds: true
        });
    }
});

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
    padding: 30px;
    padding-top: 25px;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.modal-container.error {
    width: min(calc(100% - 40px), 400px);
    margin: auto;
    background-color: var(--vp-c-danger-3);
    color: var(--vp-c-neutral);
}

.modal-container.metadata {
    position: absolute;
    top: 20px;
    right: 20px;
    background-color: var(--vp-c-bg-elv);
    color: var(--vp-c-neutral-7);
    white-space: preserve;
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
