import mainRenderTargetVS from "../../../shaders/glsl/main_render_target_vs.glsl?raw";
import mainRenderTargetFS from "../../../shaders/glsl/main_render_target_fs.glsl?raw";
import spriteVS from "../../../shaders/glsl/sprite_vs.glsl?raw";
import spriteFS from "../../../shaders/glsl/sprite_fs.glsl?raw";
import inspectTextureMipsVS from "../../../shaders/glsl/inspect/inspect_texture_mips_vs.glsl?raw";
import inspectTextureMipsFS from "../../../shaders/glsl/inspect/inspect_texture_mips_fs.glsl?raw";
import inspectTextureArrayVS from "../../../shaders/glsl/inspect/inspect_texture_array_vs.glsl?raw";
import inspectTextureArrayFS from "../../../shaders/glsl/inspect/inspect_texture_array_fs.glsl?raw";
import unlitMaterialVS from "../../../shaders/glsl/unlit_material_vs.glsl?raw";
import unlitMaterialFS from "../../../shaders/glsl/unlit_material_fs.glsl?raw";
import forwardBlinnPhongVS from "../../../shaders/glsl/forward_blinn_phong_material_vs.glsl?raw";
import forwardBlinnPhongFS from "../../../shaders/glsl/forward_blinn_phong_material_fs.glsl?raw";
import colorConversion from "../../../shaders/glsl/modules/color_conversion.glsl?raw";


/**
 * One built-in GLSL or WGSL shader registry entry.
 * `path` is set only for an importable module. By default, absent, and the entry is a program.
 * `vertex` and `fragment` are WebGL sources. By default, absent. WGSL programs use `shader` instead.
 * `shader` is a WGSL program or a module body. By default, absent.
 * `reflection` is reserved. By default, absent. Built-in GLSL entries set `{}`.
 */
export interface InternalShader {

    /** The path to the shader module. By default, absent. */
    path?: string;

    /** The vertex shader. Used by WebGL2 shaders. By default, absent. */
    vertex?: string;

    /** The fragment shader. Used by WebGL2 shaders. By default, absent. */
    fragment?: string;

    /** The WGSL program, or a module body (GLSL or WGSL) pulled in with `#include`. By default, absent. */
    shader?: string;

    /** The reflection data. By default, absent. Built-in GLSL entries set `{}`. */
    reflection?: any; // This will be type in the future.
}

/**
 * Built-in GLSL programs and modules keyed by shader id.
 * Programs set `vertex` and `fragment`; modules set `path` and `shader` and are pulled in with `#include "<path>"`.
 * @internal
 */
export const GlslShaderModuleContent : {[id: string]: InternalShader} = {

    "main_render_target": {
        "vertex": mainRenderTargetVS,
        "fragment": mainRenderTargetFS,
        "reflection": {}
    },

    "sprite": {
        "vertex": spriteVS,
        "fragment": spriteFS,
        "reflection": {}
    },

    inspect_texture_mips: {
        vertex: inspectTextureMipsVS,
        fragment: inspectTextureMipsFS,
        reflection: {}
    },

    inspect_texture_array: {
        vertex: inspectTextureArrayVS,
        fragment: inspectTextureArrayFS,
        reflection: {}
    },

    "unlit_material": {
        "vertex": unlitMaterialVS,
        "fragment": unlitMaterialFS,
        "reflection": {}
    },

    "forward_blinn_phong_material": {
        "vertex": forwardBlinnPhongVS,
        "fragment": forwardBlinnPhongFS,
        "reflection": {}
    },

    color_conversion: {
        path: "modules/color_conversion.glsl",
        shader: colorConversion,
        reflection: {}
    }
}

import mainFrameBuffer from "../../../shaders/wgsl/main_frame_buffer.wgsl?raw";
import unlitMaterial from "../../../shaders/wgsl/unlit_material.wgsl?raw";
import forwardBlinnPhongMaterial from "../../../shaders/wgsl/forward_blinn_phong_material.wgsl?raw";
import sprite from "../../../shaders/wgsl/sprite.wgsl?raw";
import inspectTextureMips from "../../../shaders/wgsl/inspect/inspect_texture_mips.wgsl?raw";
import inspectTextureArrayWgsl from "../../../shaders/wgsl/inspect/inspect_texture_array.wgsl?raw";
import colorConversionWgsl from "../../../shaders/wgsl/modules/color_conversion.wgsl?raw";

/**
 * The framework's built-in WGSL programs and modules, keyed by the same ids the WebGL backend uses where one exists.
 * `shader` is the WGSL source; every program has `main_vs` and `main_fs` entry points.
 * Modules also set `path` and are pulled in with `#include "<path>"`. `vertex` and `fragment` are absent on these entries.
 * @internal
 */
export const WgslShaderModuleContent: { [id: string]: InternalShader } = {
    main_frame_buffer: {
        shader: mainFrameBuffer
    },
    unlit_material: {
        shader: unlitMaterial
    },
    forward_blinn_phong_material: { shader: forwardBlinnPhongMaterial },
    sprite: { shader: sprite },
    inspect_texture_mips: { shader: inspectTextureMips },
    inspect_texture_array: { shader: inspectTextureArrayWgsl },
    color_conversion: {
        path: "modules/color_conversion.wgsl",
        shader: colorConversionWgsl,
        reflection: {}
    }

};
