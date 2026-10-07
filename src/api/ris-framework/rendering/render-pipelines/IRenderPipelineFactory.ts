import {ITexture2D} from "../texture/ITexture2D";
import {IMainRenderTargetRenderPipeline} from "./IMainRenderTargetRenderPipeline";
import {IUniformBuffer} from "../buffers/IUniformBuffer";
import {ISpriteRenderPipeline} from "./ISpriteRenderPipeline";
import {IInspectTextureMipsRenderPipeline} from "./IInspectTextureMipsRenderPipeline";
import {IUnlitRenderPipeline} from "./IUnlitRenderPipeline";
import {IPrimitiveState} from "../primitive/IPrimitiveState";

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
