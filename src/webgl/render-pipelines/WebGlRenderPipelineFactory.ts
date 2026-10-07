import { WebGlMainRenderTargetRenderPipeline } from "./WebGlMainRenderTargetRenderPipeline.ts";
import { WebGlSpriteRenderPipeline } from "./sprite/WebGlSpriteRenderPipeline.ts";
import type {
    IFramework,
    IInspectTextureMipsRenderPipeline,
    IMainRenderTargetRenderPipeline, IPrimitiveState, IRenderPipelineFactory,
    ISpriteRenderPipeline, ITexture2D,
    IUniformBuffer,
    IUnlitRenderPipeline
} from "../../api/index.ts";
import {WebGlInspectTextureMipsRenderPipeline} from "./inspect/WebGlInspectTextureMipsRenderPipeline.ts";
import {WebGlUnlitRenderPipeline} from "./material/WebGlUnlitRenderPipeline.ts";

/**
 * The WebGL implementation of the IRenderPipelineFactory interface.
 * This factory is responsible for creating render pipelines for WebGL rendering.
 */
export class WebGlRenderPipelineFactory implements IRenderPipelineFactory {

    /**
     * The constructor for the WebGLRenderPipelineFactory class.
     * @param _framework The framework instance.
     */
    constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createUnlitRenderPipeline(projectionViewBuffer: IUniformBuffer,
                                     modelBuffer: IUniformBuffer,
                                     materialBuffer: IUniformBuffer,
                                     primitiveState?: IPrimitiveState
                                     ): IUnlitRenderPipeline {
        const pipeline = new WebGlUnlitRenderPipeline(this._framework,
            projectionViewBuffer, modelBuffer, materialBuffer, primitiveState
            );
        pipeline.initialize();
        return pipeline;
    }

    /** @inheritDoc */
    public createMainFrameBufferPipeline(mainFrameBuffer: ITexture2D): IMainRenderTargetRenderPipeline {
        const renderPipeline = new WebGlMainRenderTargetRenderPipeline(this._framework, mainFrameBuffer);
        renderPipeline.initialize();
        return renderPipeline;
    }

    /** @inheritDoc */
    public createInspectTextureMipsRenderPipeline(
        projectionViewBuffer: IUniformBuffer,
        modelBuffer: IUniformBuffer,
        textureConstantsBuffer: IUniformBuffer,
        primitiveState?: IPrimitiveState,
        ): IInspectTextureMipsRenderPipeline {
        const pipeline = new WebGlInspectTextureMipsRenderPipeline(
            this._framework, projectionViewBuffer, modelBuffer, textureConstantsBuffer, primitiveState
        );
        pipeline.initialize();
        return pipeline;
    }

    /** @inheritdoc */
    public createSpriteRenderPipeline(projectionViewBuffer: IUniformBuffer): ISpriteRenderPipeline {
        const renderPipeline = new WebGlSpriteRenderPipeline(this._framework, projectionViewBuffer);
        renderPipeline.initialize();
        return renderPipeline;
    }

    /** @inheritdoc */
    public createMainRenderTargetRenderPipeline(renderTarget: ITexture2D): IMainRenderTargetRenderPipeline {
        const renderPipeline = new WebGlMainRenderTargetRenderPipeline(this._framework, renderTarget);
        renderPipeline.initialize();
        return renderPipeline;

    }
}