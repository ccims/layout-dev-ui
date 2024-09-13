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
                        <div ref="dialog" class="modal-container">
                            <p class="title">Error</p>
                            <p>{{ errorMessage }}</p>
                        </div>
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

import {
    createContainer,
    CreateRelationContext,
    Graph,
    GraphLayout,
    GraphModelSource,
    SelectedElement,
} from "@gropius/graph-editor";
import { onMounted } from "vue";
import {
    MonacoEditorLanguageClientWrapper,
    UserConfig,
} from "monaco-editor-wrapper";
import { shallowRef } from "vue";
import { inject } from "vue";
import { Disposable } from "vscode-languageserver-protocol";
import {
    asyncComputed,
    watchImmediate,
} from "@vueuse/core";
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
        default: false,
    },
});

const model = defineModel({
    type: String,
    required: true,
});

const editorElement = ref<HTMLElement | null>(null);
const sprottyWrapper = ref<HTMLElement | null>(null);
const disposables = shallowRef<Disposable[]>([]);
const hideMainContent = ref(true);

watch(model, (value) => {
    if (editor.value != undefined) {
        editor.value.setValue(value);
    }
});

const { isDark } = useData();

const colorTheme = computed(() =>
    isDark.value ? "Default Dark Modern" : "Default Light Modern"
);

watch(isDark, () => {
    updateUserConfiguration(
        JSON.stringify({ "workbench.colorTheme": colorTheme.value })
    );
});

class ModelSource extends GraphModelSource {
    protected layoutUpdated(
        partialUpdate: GraphLayout,
        resultingLayout: GraphLayout
    ): void {}
    protected handleSelectionChanged(
        selectedElements: SelectedElement<any>[]
    ): void {}
    protected handleCreateRelation(context: CreateRelationContext): void {}
}

const editor = shallowRef<{ setValue(value: string): void }>()
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

const layout = asyncComputed<GraphLayout>(async () => {
    if (parsedModel.value == undefined || layoutServerUrl.value == "") {
        return {};
    }
    const res = await fetch(layoutServerUrl.value, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(toRaw(parsedModel.value)),
    }).then((response) => response.json());
    return res.data;
}, {});

watchEffect(() => {
    if (
        layout.value != undefined &&
        modelSource.value != undefined &&
        parsedModel.value != null
    ) {
        modelSource.value.updateGraph({
            graph: parsedModel.value,
            layout: layout.value,
            fitToBounds: true,
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
                        uri: "graph.yaml",
                    },
                },
                userConfiguration: {
                    json: JSON.stringify({
                        "workbench.colorTheme": colorTheme.value,
                    }),
                },
            },
        },
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
            fitToBounds: false,
        });
        modelSource.value!.updateGraph({
            graph: currentModel,
            layout: {},
            fitToBounds: true,
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
    width: min(calc(100% - 40px), 400px);
    margin: auto;
    padding: 30px;
    padding-top: 25px;
    background-color: var(--vp-c-danger-3);
    color: var(--vp-c-neutral);
    border-radius: 12px;
    transition: all 0.3s ease;
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
