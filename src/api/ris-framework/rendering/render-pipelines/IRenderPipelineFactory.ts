import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { IMainRenderTargetRenderPipeline } from "./IMainRenderTargetRenderPipeline.ts";
import type { IUniformBuffer } from "../buffers/IUniformBuffer.ts";
import type { ISpriteRenderPipeline } from "./ISpriteRenderPipeline.ts";
import type { IInspectTextureMipsRenderPipeline } from "./IInspectTextureMipsRenderPipeline.ts";
import type { IUnlitRenderPipeline } from "./IUnlitRenderPipeline.ts";
import type { IPrimitiveState } from "../primitive/IPrimitiveState.ts";

/**
 * The pipeline factory.
 */
export interface IRenderPipelineFactory {

    /**
     * Creates the .
     * @param mainFrameBuffer - The  acting as a main frame buffer.
     * @returns The .
     */
    createMainFrameBufferPipeline(mainFrameBuffer: ITexture2D): IMainRenderTargetRenderPipeline;

    /**
     * Creates the .
     * @param projectionViewBuffer - The projection view .
     * @returns The sprite render pipeline.
     */
    createSpriteRenderPipeline(projectionViewBuffer: IUniformBuffer): ISpriteRenderPipeline;

    /**
     * Creates the inspect texture mip level pipeline.
     * @param projectionViewBuffer - The projection view buffer.
     * @param modelBuffer - The world buffer.
     * @param textureConstantsBuffer - The texture constants buffer.
     * @returns The .
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

}
