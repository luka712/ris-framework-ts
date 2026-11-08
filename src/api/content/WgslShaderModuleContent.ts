import mainFrameBuffer from "../../../shaders/wgsl/main_frame_buffer.wgsl?raw";
import unlitMaterial from "../../../shaders/wgsl/unlit_material.wgsl?raw";
import forwardBlinnPhongMaterial from "../../../shaders/wgsl/forward_blinn_phong_material.wgsl?raw";
import sprite from "../../../shaders/wgsl/sprite.wgsl?raw";
import inspectTextureMips from "../../../shaders/wgsl/inspect_texture_mips.wgsl?raw";
import colorConversion from "../../../shaders/wgsl/modules/color_conversion.wgsl?raw";

/**
 * One built-in WGSL program or one shared module.
 * Programs omit `path` and store a full shader in `shader`.
 * Modules set `path` to the `#import` string and store the included source in `shader`.
 */
export interface WgslShaderModuleEntry {
    /**
     * Import path, for example `modules/color_conversion.wgsl`.
     * By default, absent: the entry is a program, not an importable module.
     */
    path?: string;
    /** WGSL source. By default, absent. */
    shader?: string;
    /** Reserved for reflection data. By default, an empty object on built-in entries. */
    reflection?: object;
}

/**
 * Built-in WGSL programs and shared modules.
 * Counterpart of {@link GlslShaderModuleContent}, which lives in the same directory.
 * A program source may contain `#import "path"` lines. The WebGPU shader module splices those in.
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
