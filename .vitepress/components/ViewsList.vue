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
                  :class="{ 'highlighted': name === currentView }"
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
import {emit} from "../util/viewChanger";

let currentView = "Default";
const showDialog = ref(false);
const dialog = ref<HTMLElement | null>(null);

onClickOutside(dialog, () => {
  showDialog.value = false;
});

const views: Record<string, () => Promise<any>> = {
  "Default": async () => ({ default: "Default" }),
  "Hosted on": async () => ({ default: "Hosted on" }),
  "Includes": async () => ({ default: "Includes" }),
  "Calls": async () => ({ default: "Calls" }),
};

async function changeView(name: string) {
  showDialog.value = false;
  currentView = name;
  emit('view', name);
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

.highlighted {
  background: var(--vp-c-important-1);
}
</style>
