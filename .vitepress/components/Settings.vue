<template>
    <IconButton icon="vpi-settings" label="Settings" class="settings-button" @click="showDialog = true" />
    <ClientOnly>
        <Teleport to="body">
            <Transition name="modal">
                <div v-show="showDialog" class="modal-mask">
                    <div ref="dialog" class="modal-container">
                        <p class="title">Settings</p>
                        <div>
                            <div v-for="(name, key) in names" :key="key">
                                <p class="subtitle">{{ name }}</p>
                                <input
                                    v-model="settings![key]"
                                    class="text-field"
                                    :class="{ invalid: !validState[key] }"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </ClientOnly>
</template>
<script setup lang="ts">
import { inject, ref } from "vue";
import IconButton from "./IconButton.vue";
import { mapObject } from "../util/mapObject.js";
import { onClickOutside } from "@vueuse/core";
import { settingsKey } from "../theme/settings";

const showDialog = ref(false);
const dialog = ref<HTMLElement | null>(null);

onClickOutside(dialog, () => {
    showDialog.value = false;
});

const names = {
    serverUrl: "Layout server url"
};

const settings = inject(settingsKey);

const validState = ref(mapObject(names, () => true));
</script>
<style scoped>
.settings-button {
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

.text-field {
    background-color: var(--vp-c-bg-alt);
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 4px 12px;
    width: 100%;
}

.text-field:hover,
.text-field:focus {
    border-color: var(--vp-c-brand);
}

.text-field.invalid {
    border-color: var(--vp-c-danger-1);
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
