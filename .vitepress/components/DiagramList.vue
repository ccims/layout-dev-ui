<template>
    <IconButton icon="vpi-diagrams" label="Diagrams" class="diagrams-button" @click="showDialog = true" />
    <ClientOnly>
        <Teleport to="body">
            <Transition name="modal">
                <div v-show="showDialog" class="modal-mask">
                    <div ref="dialog" class="modal-container">
                        <p class="title">Diagrams</p>
                        <div class="diagram-list">
                            <button v-for="[name] in Object.entries(diagrams)" :key="name" class="diagram-card" @click="openDiagram(name)">
                                {{ name }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </ClientOnly>
</template>
<script setup lang="ts">
import { ref } from "vue";
import IconButton from "./IconButton.vue";
import { onClickOutside } from "@vueuse/core";

const showDialog = ref(false);
const dialog = ref<HTMLElement | null>(null);

const emit = defineEmits<{
    openDiagram: [value: string];
}>()

onClickOutside(dialog, () => {
    showDialog.value = false;
});

const diagrams: Record<string, () => Promise<any>> = {
    "Hello world": () => import("../../diagrams/hello_world.yaml?raw"),
    "Webshop Except Sample": () => import("../../diagrams/webshop-excerpt-sample.yaml?raw"),
    "TeaStore": () => import("../../diagrams/TeaStore.yaml?raw"),
    "Sock Shop": () => import("../../diagrams/Sock-Shop.yaml?raw"),
    "Train Ticket": () => import("../../diagrams/Train-Ticket.yaml?raw"),
    "DeathStarBench": () => import("../../diagrams/DeathStarBench-complete.yaml?raw"),
    "Online Boutique (expanded)": () => import("../../diagrams/Online-Boutique-expanded.yaml?raw"),
}

async function openDiagram(name: string) {
    const diagram = await diagrams[name]();
    emit("openDiagram", diagram.default);
    showDialog.value = false;
}

</script>
<style scoped>
.diagrams-button {
    align-self: center;
}

.modal-mask {
    position: fixed;
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
    background-color: var(--vp-c-bg);
    border-radius: 12px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
}

.title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 25px;
}

.subtitle {
    font-size: 16px;
    margin-top: 15px;
    margin-bottom: 8px;
}

.diagram-card {
    background: var(--vp-c-bg-alt);
    padding: 15px;
    border-radius: 4px;
    display: block;
    width: 100%;
    text-align: left;
}

.diagram-card:hover {
    background: var(--vp-c-important-2);
}

.diagram-list {
    overflow: auto;
    gap: 10px;
    display: grid;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(1.1);
}
</style>
