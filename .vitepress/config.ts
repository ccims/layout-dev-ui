import { defineConfig } from "vitepress";
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'


export default defineConfig({
    title: "Gropius Layout DEV UI",
    themeConfig: {
        nav: [
            { text: "Docs", link: "/docs/docs" },
            {
                component: "NavTeleportTarget",
                props: { "target-id": "copy-diagram-link" },
            },
            {
                component: "NavTeleportTarget",
                props: { "target-id": "export-diagram" },
            },
            {
                component: "NavTeleportTarget",
                props: { "target-id": "diagram-list" },
            },
            { component: "Settings" },
        ],

        sidebar: [
            {
                text: "Getting Started",
                collapsed: false,
                items: [{ text: "Gropius Layout DEV UI", link: "/docs/docs" }],
            },
        ],

        search: {
            provider: "local",
        },

        socialLinks: [
            { icon: "github", link: "https://github.com/ccims/layout-dev-ui" },
        ],
    },
    vite: {
        resolve: {
            dedupe: ["vscode"],
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [importMetaUrlPlugin],
            },
        },
    },
});
