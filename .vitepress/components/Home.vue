<template>
    <div class="main">
        <VPNav class="navbar" />
        <GraphEditor
            v-model="code"
            :horizontal="height > width && width < 800"
            class="main-content"
        />
        <ClientOnly>
            <Teleport to="#copy-diagram-link">
                <IconButton label="Copy link" icon="vpi-link" @click="copyLink" />
                <span class="tooltip" :class="{ active: copiedSuccess }">Copied!</span>
            </Teleport>
            <Teleport to="#export-diagram">
                <IconButton label="Download source" icon="vpi-download" @click="downloadSource" />
            </Teleport>
        </ClientOnly>
    </div>
</template>
<script setup lang="ts">
import VPNav from "vitepress/dist/client/theme-default/components/VPNav.vue";
import { useLocalStorage, onKeyStroke, useWindowSize } from "@vueuse/core";
import { defineClientComponent, useData } from "vitepress";
import IconButton from "./IconButton.vue";
import { ref } from "vue";
import fileSaver from "file-saver";
import { serialize, deserialize } from "../util/serialization.js";
import { onBeforeMount } from "vue";

const GraphEditor = defineClientComponent(() => import("./GraphEditor.vue"));

const { isDark, site } = useData();
const { width, height } = useWindowSize();

const defaultCode = `hello:
  name: Hello
  template: Microservice
  interfaces:
    hello_rest:
      name: REST
      template: REST
world:
  name: World
  template: Microservice
  relations:
    - to: hello_rest
      template: Calls`

const code = useLocalStorage(
    "code",
    defaultCode
);
// const diagram = ref<Root>();
const copiedSuccess = ref(false);

onKeyStroke("s", (event) => {
    if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        downloadSource();
    }
});

function downloadSource() {
    fileSaver.saveAs(new Blob([code.value]), "diagram.hyl");
}

function copyLink() {
    const data = serialize(code.value, "pako");
    const url = new URL(site.value.base, window.location.href);
    navigator.clipboard.writeText(url.toString() + "#" + data);
    copiedSuccess.value = true;
    setTimeout(() => {
        copiedSuccess.value = false;
    }, 1000);
}

onBeforeMount(() => {
    const hash = window.location.hash;
    if (hash) {
        try {
            code.value = deserialize(hash.substring(1));
            history.replaceState(null, "", window.location.pathname);
        } catch (e) {
            console.warn("Failed to deserialize diagram from URL", e);
        }
    }
});
</script>
<style scoped>
.main {
    height: 100svh;
    display: flex;
    flex-direction: column;
}
.navbar {
    position: relative;
}
.main-content {
    width: 100%;
    flex-grow: 1;
    overflow: hidden;
}

.menu-button {
    display: block;
    width: 100%;
    text-align: left;
    border-radius: 6px;
    padding: 0 12px;
    line-height: 32px;
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-1);
    transition:
        background-color 0.25s,
        color 0.25s;
}

.menu-button:hover {
    color: var(--vp-c-brand-1);
    background-color: var(--vp-c-default-soft);
}

.tooltip {
    display: block;
    position: absolute;
    top: 45px;
    left: -15px;
    font-size: 14px;
    transform: scale(0.9);
    color: var(--vp-c-text-1);
    border: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg-elv);
    box-shadow: var(--vp-shadow-3);
    padding: 8px 10px;
    border-radius: 8px;
    opacity: 0;
    pointer-events: none;
    transition: cubic-bezier(0.19, 1, 0.22, 1) 0.2s;
    transition-property: opacity, transform;
}

.tooltip.active {
    opacity: 1;
    transform: scale(1);
}

.download-flyout {
    margin-right: -4px;
}
</style>
<style>
body {
    height: 100svh;
    min-height: unset;
}
</style>
