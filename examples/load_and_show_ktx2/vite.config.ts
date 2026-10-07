import {defineConfig} from "vite";
import {fileURLToPath} from "node:url";
import {stubRisKtx2NodeModule} from "../../vite.config.ts";

const exampleRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Browser page for examples/load_and_show_ktx2.
 * The repo root config still serves index.html. This one serves only this example.
 */
export default defineConfig({
    root: exampleRoot,
    publicDir: false,
    plugins: [stubRisKtx2NodeModule()],
    server: {
        fs: {
            allow: [repoRoot],
        },
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
    },
});
