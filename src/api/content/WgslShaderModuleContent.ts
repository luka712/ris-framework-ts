import mainFrameBuffer from "../../../shaders/wgsl/main_frame_buffer.wgsl?raw";
import unlitMaterial from "../../../shaders/wgsl/unlit_material.wgsl?raw";
import forwardBlinnPhongMaterial from "../../../shaders/wgsl/forward_blinn_phong_material.wgsl?raw";
import sprite from "../../../shaders/wgsl/sprite.wgsl?raw";
import inspectTextureMips from "../../../shaders/wgsl/inspect_texture_mips.wgsl?raw";
import colorConversion from "../../../shaders/wgsl/modules/color_conversion.wgsl?raw";

/**
 * One built-in WGSL program or one shared module.
 * A program omits `path` and stores a full shader in `shader`.
 * A module sets `path` to the quoted `#import` path and stores the included source in `shader`.
 */
export interface WgslShaderModuleEntry {
    /**
     * Import path matched against `#import "path"`, for example `modules/color_conversion.wgsl`.
     * By default, absent: the entry is a program, not an importable module.
     */
    path?: string;
    /**
     * WGSL source. Program entries are full shaders and may still contain `#import` lines.
     * Module entries are the text those lines are replaced with.
     * By default, absent. An entry with `shader` absent cannot be loaded or imported.
     */
    shader?: string;
    /**
     * Reserved for reflection data.
     * By default, absent. Every built-in entry in {@link WgslShaderModuleContent} sets this to `{}`.
     */
    reflection?: object;
}

/**
 * Built-in WGSL programs and shared modules, keyed by shader id.
 * Lives next to {@link GlslShaderModuleContent}.
 *
 * Program ids (`main_frame_buffer`, `unlit_material`, `forward_blinn_phong_material`, `sprite`,
 * `inspect_texture_mips`) have no `path`. `color_conversion` is only a module: its `path` is
 * `modules/color_conversion.wgsl`, so that id is not a program.
 * A program may contain full-line `#import "path"` directives. {@link WebGpuShaderModule} splices them.
 * @internal
 */
export const WgslShaderModuleContent: {[id: string]: WgslShaderModuleEntry} = {
    "main_frame_buffer": {
        shader: mainFrameBuffer,
        reflection: {},
    },
    "unlit_material": {
        shader: unlitMaterial,
        reflection: {},
    },
    "forward_blinn_phong_material": {
        shader: forwardBlinnPhongMaterial,
        reflection: {},
    },
    "sprite": {
        shader: sprite,
        reflection: {},
    },
    "inspect_texture_mips": {
        shader: inspectTextureMips,
        reflection: {},
    },
    color_conversion: {
        path: "modules/color_conversion.wgsl",
        shader: colorConversion,
        reflection: {},
    },
};
