import mainRenderTargetFlipYVS from "../../shaders/glsl/main_render_target_flip_y_vs.glsl?raw";
import mainRenderTargetFlipYFS from "../../shaders/glsl/main_render_target_flip_y_fs.glsl?raw";
import spriteVS from "../../shaders/glsl/sprite_vs.glsl?raw";
import spriteFS from "../../shaders/glsl/sprite_fs.glsl?raw";
import inspectTextureMipsVS from "../../shaders/glsl/inspect_texture_mips_vs.glsl?raw";
import inspectTextureMipsFS from "../../shaders/glsl/inspect_texture_mips_fs.glsl?raw";
import unlitMaterialVS from "../../shaders/glsl/unlit_material_vs.glsl?raw";
import unlitMaterialFS from "../../shaders/glsl/unlit_material_fs.glsl?raw";

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


export const ShaderModuleContent : {[id: string]: any} = {

    "main_render_target_flip_y": {
        "vertex": mainRenderTargetFlipYVS,
        "fragment": mainRenderTargetFlipYFS,
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
    }
}