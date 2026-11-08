import mainRenderTargetVS from "../../../shaders/glsl/main_render_target_vs.glsl?raw";
import mainRenderTargetFS from "../../../shaders/glsl/main_render_target_fs.glsl?raw";
import spriteVS from "../../../shaders/glsl/sprite_vs.glsl?raw";
import spriteFS from "../../../shaders/glsl/sprite_fs.glsl?raw";
import inspectTextureMipsVS from "../../../shaders/glsl/inspect_texture_mips_vs.glsl?raw";
import inspectTextureMipsFS from "../../../shaders/glsl/inspect_texture_mips_fs.glsl?raw";
import unlitMaterialVS from "../../../shaders/glsl/unlit_material_vs.glsl?raw";
import unlitMaterialFS from "../../../shaders/glsl/unlit_material_fs.glsl?raw";
import forwardBlinnPhongVS from "../../../shaders/glsl/forward_blinn_phong_material_vs.glsl?raw";
import forwardBlinnPhongFS from "../../../shaders/glsl/forward_blinn_phong_material_fs.glsl?raw";
import colorConversion from "../../../shaders/glsl/modules/color_conversion.glsl?raw";


/**
 * The api should look something like this for internal ones.
 * export const ShaderContent = {
 *     "example_shader": {
 *         "shader": "{combined_shader}", // WebGPU
 *         "vertex": "{some_vertex_code}", // WebGL
 *         "fragment": "{some_fragment_code}", // WebGL
 *         "reflection": "{reflection_object}", // Both
 *     }
 */


interface InternalShader {
    path?: string;
    vertex?: string;
    fragment?: string;
    shader?: string;
    reflection?: any; // This will be type in the future.
}


export const ShaderModuleContent : {[id: string]: InternalShader} = {

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

    "inspect_texture_mips": {
        "vertex": inspectTextureMipsVS,
        "fragment": inspectTextureMipsFS,
        "reflection": {}
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