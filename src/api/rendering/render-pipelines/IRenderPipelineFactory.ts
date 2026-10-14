import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { IMainRenderTargetRenderPipeline } from "./IMainRenderTargetRenderPipeline.ts";
import type { IUniformBuffer } from "../buffers/IUniformBuffer.ts";
import type { ISpriteRenderPipeline } from "./ISpriteRenderPipeline.ts";
import type { IInspectTextureMipsRenderPipeline } from "./IInspectTextureMipsRenderPipeline.ts";
import type { IUnlitRenderPipeline } from "./IUnlitRenderPipeline.ts";
import type { IPrimitiveState } from "../primitive/IPrimitiveState.ts";
import type { IForwardBlinnPhongRenderPipeline } from "./IForwardBlinnPhongRenderPipeline.ts";

/** The descriptor for the forward Blinn-Phong render pipeline. */
export interface ForwardBlinnPhongRenderPipelineDescriptor {

    /** The projection view buffer, e.g. `camera.projectionViewBuffer`. */
    projectionViewBuffer: IUniformBuffer;

    /** The world buffer. */
    modelBuffer: IUniformBuffer;

    /** The material buffer (ambient and diffuse color). */
    materialBuffer: IUniformBuffer;

    /**
     * The lights buffer, e.g. `lightsBuffer.buffer`.
     * Optional: it can be set later through `pipeline.lightsBuffer`.
     */
    lightsBuffer?: IUniformBuffer;

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
     * @param textureConstantsBuffer - The texture constants buffer.
     * @returns The inspect texture mips render pipeline.
     */
    createInspectTextureMipsRenderPipeline(projectionViewBuffer: IUniformBuffer, modelBuffer: IUniformBuffer, textureConstantsBuffer: IUniformBuffer): IInspectTextureMipsRenderPipeline;


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
