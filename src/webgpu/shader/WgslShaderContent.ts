import {WgslShaderModuleContent} from "../../api/content/WgslShaderModuleContent.ts";

/**
 * Built-in WGSL program sources keyed by shader id.
 * Filled from {@link WgslShaderModuleContent}: an entry is included only when `path` is absent and `shader` is present.
 * Shared modules such as `color_conversion` are omitted. Values are the raw shader text, `#import` lines included,
 * before {@link WebGpuShaderModule} expands them. There is no further default entry.
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
