import {defineConfig} from "vite";
import {stubRisKtx2NodeModule} from "./vite.config.ts";

const externalPackages = [
    "gl-matrix",
    "reflect-metadata",
    "ris-framework-api",
    "ris-ktx2-api",
    "tsyringe",
];

/**
 * Library build. The sample page stays on `vite.config.ts`.
 * Direct dependencies stay external so a consumer resolves them from its own install.
 * `ris-ktx2` is bundled with the Node loader stubbed out. Its published entry has no
 * browser export, and a consumer Vite build otherwise fails on `node:fs`.
 * Vite inlines the `?raw` GLSL imports into the emitted JavaScript.
 */
export default defineConfig({
    plugins: [stubRisKtx2NodeModule()],
    publicDir: false,
    build: {
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: "index",
        },
        outDir: "dist",
        emptyOutDir: true,
        minify: false,
        sourcemap: false,
        target: "es2022",
        rollupOptions: {
            external: (id) => externalPackages.some((name) => id === name || id.startsWith(`${name}/`)),
        },
    },
});
