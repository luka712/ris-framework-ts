import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { IMainRenderTargetRenderPipeline } from "./IMainRenderTargetRenderPipeline.ts";
import type { IUniformBuffer } from "../buffers/IUniformBuffer.ts";
import type { ISpriteRenderPipeline } from "./ISpriteRenderPipeline.ts";
import type { IInspectTextureMipsRenderPipeline } from "./inspect/IInspectTextureMipsRenderPipeline.ts";
import type { IUnlitRenderPipeline } from "./IUnlitRenderPipeline.ts";
import type { IPrimitiveState } from "../primitive/IPrimitiveState.ts";
import type { IForwardBlinnPhongRenderPipeline } from "./IForwardBlinnPhongRenderPipeline.ts";
import type {IInspectTextureArrayRenderPipeline} from "./inspect/IInspectTextureArrayRenderPipeline.ts";

/** The descriptor for the forward Blinn-Phong render pipeline. */
export interface ForwardBlinnPhongRenderPipelineDescriptor {

    /** The projection view buffer, e.g. `camera.projectionViewBuffer`. */
    projectionViewBuffer: IUniformBuffer;

    /** The world buffer. */
    modelBuffer: IUniformBuffer;

    /** The camera position buffer, e.g. `camera.positionBuffer`: std140 `vec3` world-space eye. */
    cameraPositionBuffer: IUniformBuffer;

    /** The material buffer (ambient and diffuse color). */
    materialBuffer: IUniformBuffer;

    /**
     * The lights buffer, e.g. `lightsBuffer.buffer`.
     * Optional: it can be set later through `pipeline.lightsBuffer`.
     */
    lightsBuffer?: IUniformBuffer;

    /** Directional light slots to compile the shader with; must match the lights buffer. Defaults to `DEFAULT_DIRECTIONAL_LIGHTS_COUNT`. */
    maxDirectionalLights?: number;

    /** Point light slots to compile the shader with; must match the lights buffer. Defaults to `DEFAULT_POINT_LIGHTS_COUNT`. */
    maxPointLights?: number;

    /** The primitive state. */
    primitiveState?: IPrimitiveState;
}

/**
 * The pipeline factory.
 */
export interface IRenderPipelineFactory {

    /**
     * Creates the main render target pipeline.
     * @param mainFrameBuffer - The texture acting as a main frame buffer.
     * @returns The main render target render pipeline.
     */
    createMainFrameBufferPipeline(mainFrameBuffer: ITexture2D): IMainRenderTargetRenderPipeline;

    /**
     * Creates the sprite render pipeline.
     * @param projectionViewBuffer - The projection view buffer.
     * @returns The sprite render pipeline.
     */
    createSpriteRenderPipeline(projectionViewBuffer: IUniformBuffer): ISpriteRenderPipeline;

    /**
     * Creates the inspect texture mip level pipeline.
     * @param projectionViewBuffer - The projection view buffer.
     * @param modelBuffer - The world buffer.
     * @param fragmentDataBuffer - The fragment data buffer: one std140 float `[mipLevel]`, the mip level to sample.
     * @returns The initialized inspect texture mips render pipeline (WebGL2 and WebGPU).
     */
    createInspectTextureMipsRenderPipeline(projectionViewBuffer: IUniformBuffer, modelBuffer: IUniformBuffer, fragmentDataBuffer: IUniformBuffer): IInspectTextureMipsRenderPipeline;

    /**
     * Creates the inspect texture array pipeline.
     * @param projectionViewBuffer - The projection view buffer.
     * @param modelBuffer - The world buffer.
     * @param fragmentDataBuffer - The fragment data buffer: std140 floats `[inspectLod, layer, mipLevel, padding]`.
     * @returns The initialized inspect texture array render pipeline (WebGL2 and WebGPU).
     */
    createInspectTextureArrayRenderPipeline(projectionViewBuffer: IUniformBuffer, modelBuffer: IUniformBuffer, fragmentDataBuffer: IUniformBuffer): IInspectTextureArrayRenderPipeline;

    /**
     * Creates the unlit render pipeline.
     * @param projectionViewBuffer - The projection view buffer.
     * @param modelBuffer - The world buffer.
     * @param materialBuffer - The material buffer.
     * @param primitiveState - The primitive state.
     * @returns The unlit render pipeline.
     */
    createUnlitRenderPipeline(projectionViewBuffer: IUniformBuffer,
                              modelBuffer: IUniformBuffer,
                              materialBuffer: IUniformBuffer,
                              primitiveState?: IPrimitiveState
                              ): IUnlitRenderPipeline;

    /**
     * Creates the forward Blinn-Phong render pipeline.
     * @param descriptor - The buffers and primitive state for the pipeline.
     * @returns The forward Blinn-Phong render pipeline.
     */
    createForwardBlinnPhongRenderPipeline(descriptor: ForwardBlinnPhongRenderPipelineDescriptor): IForwardBlinnPhongRenderPipeline;

}
