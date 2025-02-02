<template>
  <IconButton icon="vpi-views" label="Views" class="views-button" @click="showDialog = true" />
  <ClientOnly>
    <Teleport to="body">
      <Transition name="modal">
        <div v-show="showDialog" class="modal-mask">
          <div ref="dialog" class="modal-container">
            <p class="title">Views</p>
            <div class="views-list">
              <button
                  v-for="[name] in Object.entries(views)"
                  :key="name"
                  class="views-card"
                  @click="changeView(name)"
              >
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
import {ref, shallowRef} from "vue";
import IconButton from "./IconButton.vue";
import { onClickOutside } from "@vueuse/core";

const showDialog = ref(false);
const dialog = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  changeView: [value: string];
}>();

onClickOutside(dialog, () => {
  showDialog.value = false;
});

const views: Record<string, () => Promise<any>> = {
  "Sock Shop Default": () => import("../../diagrams/Sock-Shop.yaml?raw"),
  "Sock Shop Hosted-On": () => import("../../diagrams/Sock-Shop-Hosted-On.yaml?raw"),
  "Sock Shop Includes": () => import("../../diagrams/Sock-Shop-Includes.yaml?raw"),
  "Sock Shop Calls and Database": () => import("../../diagrams/Sock-Shop-Calls.yaml?raw"),
  "Tea Store Default": () => import("../../diagrams/TeaStore.yaml?raw"),
  "Tea Store Hosted-On": () => import("../../diagrams/TeaStore-Hosted-On.yaml?raw"),
  "Tea Store Includes": () => import("../../diagrams/TeaStore-Includes.yaml?raw"),
  "Tea Store Calls and Database": () => import("../../diagrams/TeaStore-Calls.yaml?raw"),
};

async function changeView(name: string) {
  const view = await views[name]();
  emit("changeView", view.default);
  showDialog.value = false;
}
</script>
<style scoped>
.views-button {
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

.views-card {
  background: var(--vp-c-bg-alt);
  padding: 15px;
  border-radius: 4px;
  display: block;
  width: 100%;
  text-align: left;
}

.views-card:hover {
  background: var(--vp-c-important-2);
}

.views-list {
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
