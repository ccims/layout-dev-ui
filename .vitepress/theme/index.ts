import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./style.css";
import "./icons.css";
import NavTeleportTarget from "../components/NavTeleportTarget.vue";
import Settings from "../components/Settings.vue";
import { settingsPlugin } from "./settings";

export default {
    extends: DefaultTheme,
    async enhanceApp({ app }) {
        app.component("NavTeleportTarget", NavTeleportTarget);
        app.component("Settings", Settings);
        app.use(settingsPlugin);
    }
} satisfies Theme;
