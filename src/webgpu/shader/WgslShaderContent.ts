import {WgslShaderModuleContent} from "../../api/content/WgslShaderModuleContent.ts";

/**
 * Built-in WGSL program sources keyed by shader id.
 * Entries with `path` are shared modules and are not programs.
 * @internal
 */
export const WgslShaderContent: {[id: string]: string} = {};

for (const id in WgslShaderModuleContent) {
    const entry = WgslShaderModuleContent[id];
    const shader = entry.shader;
    if (entry.path == undefined && shader != undefined) {
        WgslShaderContent[id] = shader;
    }
}
