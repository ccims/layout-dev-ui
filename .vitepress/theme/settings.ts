import { useLocalStorage } from "@vueuse/core";
import { InjectionKey, Plugin, Ref } from "vue";

export interface Settings {
    serverUrl: string;
}

export const settingsKey = Symbol("settings") as InjectionKey<Ref<Partial<Settings>>>;

export const settingsPlugin: Plugin = {
    install(app) {
        const settings = app.runWithContext(() => {
            return useLocalStorage<Partial<Settings>>("layoutDevUISettings", {});
        })
        app.provide(settingsKey, settings);
    }
}