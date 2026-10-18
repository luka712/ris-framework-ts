import {defineConfig} from "vite";
import {readdirSync, existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {join} from "node:path";
import {stubRisKtx2NodeModule} from "../vite.config.ts";

const examplesRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Every `examples/<name>/index.html` becomes a page, so a new example only needs its own folder.
 * `examples/index.html` links them.
 */
const pages: Record<string, string> = {index: join(examplesRoot, "index.html")};
for (const entry of readdirSync(examplesRoot, {withFileTypes: true})) {
    const page = join(examplesRoot, entry.name, "index.html");
    if (entry.isDirectory() && entry.name !== "dist" && existsSync(page)) {
        pages[entry.name] = page;
    }
}

export default defineConfig({
    root: examplesRoot,
    publicDir: false,
    plugins: [stubRisKtx2NodeModule()],
    server: {fs: {allow: [repoRoot]}},
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {input: pages},
    },
});
