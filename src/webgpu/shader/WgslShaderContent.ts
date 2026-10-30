import mainFrameBuffer from "../../../shaders/wgsl/main_frame_buffer.wgsl?raw";
import mainRenderTargetFlipY from "../../../shaders/wgsl/main_render_target_flip_y.wgsl?raw";
import unlitMaterial from "../../../shaders/wgsl/unlit_material.wgsl?raw";
import forwardBlinnPhongMaterial from "../../../shaders/wgsl/forward_blinn_phong_material.wgsl?raw";
import sprite from "../../../shaders/wgsl/sprite.wgsl?raw";
import inspectTextureMips from "../../../shaders/wgsl/inspect_texture_mips.wgsl?raw";

/**
 * The framework's built-in WGSL shaders, keyed by the same ids the WebGL backend uses where one exists.
 * Every shader has `main_vs` and `main_fs` entry points.
 * @internal
 */
export const WgslShaderContent: { [id: string]: string } = {
    "main_frame_buffer": mainFrameBuffer,
    "main_render_target_flip_y": mainRenderTargetFlipY,
    "unlit_material": unlitMaterial,
    "forward_blinn_phong_material": forwardBlinnPhongMaterial,
    "sprite": sprite,
    "inspect_texture_mips": inspectTextureMips,
};
