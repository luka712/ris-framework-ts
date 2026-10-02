import {defineConfig, type Plugin} from "vite";

/**
 * `ris-ktx2` publishes a single entry (`dist/index.js`). That entry loads
 * `ktx-module-node-*.js` through a dynamic import when it detects Node.
 * There is no browser export to select instead, and Vite's production client
 * build still parses that Node chunk, which imports `node:fs` and the other
 * Node built-ins. The browser path never executes the import, so replace the
 * chunk with a stub before it is bundled.
 */
function stubRisKtx2NodeModule(): Plugin {
    const stubId = "\0ris-ktx2-node-module-stub";

    return {
        name: "stub-ris-ktx2-node-module",
        enforce: "pre",
        resolveId(source, importer) {
            if (!importer?.includes("ris-ktx2")) {
                return null;
            }
            if (!source.replaceAll("\\", "/").includes("ktx-module-node")) {
                return null;
            }
            return stubId;
        },
        load(id) {
            if (id !== stubId) {
                return null;
            }
            return `
export function createKtxModuleNode() {
    throw new Error("ris-ktx2 Node loader is not included in the browser build.");
}
export function readFileBytes() {
    throw new Error("ris-ktx2 Node file loader is not included in the browser build.");
}
`;
        },
    };
}

export default defineConfig({
    plugins: [stubRisKtx2NodeModule()],
});
