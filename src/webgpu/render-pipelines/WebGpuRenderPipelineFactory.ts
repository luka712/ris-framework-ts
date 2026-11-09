import type {
    ForwardBlinnPhongRenderPipelineDescriptor,
    IForwardBlinnPhongRenderPipeline,
    IFramework,
    IInspectTextureMipsRenderPipeline,
    IInspectTextureArrayRenderPipeline,
    IMainRenderTargetRenderPipeline,
    IPrimitiveState,
    IRenderPipelineFactory,
    ISpriteRenderPipeline,
    ITexture2D,
    IUniformBuffer,
    IUnlitRenderPipeline,
} from "../../api/index.ts";
import {WebGpuMainRenderTargetRenderPipeline} from "./WebGpuMainRenderTargetRenderPipeline.ts";
import {WebGpuUnlitRenderPipeline} from "./material/WebGpuUnlitRenderPipeline.ts";
import {WebGpuSpriteRenderPipeline} from "./sprite/WebGpuSpriteRenderPipeline.ts";

/**
 * The WebGPU render pipeline factory. Slice 1 implements the main render target and unlit pipelines.
 * @internal
 */
export class WebGpuRenderPipelineFactory implements IRenderPipelineFactory {

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createMainFrameBufferPipeline(mainFrameBuffer: ITexture2D): IMainRenderTargetRenderPipeline {
        const pipeline = new WebGpuMainRenderTargetRenderPipeline(this._framework, mainFrameBuffer);
        pipeline.initialize();
        return pipeline;
    }

    /** Same as {@link createMainFrameBufferPipeline}, mirroring the WebGL factory. */
    public createMainRenderTargetRenderPipeline(renderTarget: ITexture2D): IMainRenderTargetRenderPipeline {
        return this.createMainFrameBufferPipeline(renderTarget);
    }

    /** @inheritDoc */
    public createUnlitRenderPipeline(projectionViewBuffer: IUniformBuffer,
                                     modelBuffer: IUniformBuffer,
                                     materialBuffer: IUniformBuffer,
                                     primitiveState?: IPrimitiveState): IUnlitRenderPipeline {
        const pipeline = new WebGpuUnlitRenderPipeline(this._framework, projectionViewBuffer, modelBuffer, materialBuffer, primitiveState);
        pipeline.initialize();
        return pipeline;
    }

    /** @inheritDoc */
    public createSpriteRenderPipeline(projectionViewBuffer: IUniformBuffer): ISpriteRenderPipeline {
        const pipeline = new WebGpuSpriteRenderPipeline(this._framework, projectionViewBuffer);
        pipeline.initialize();
        return pipeline;
    }

    /**
     * Not implemented for WebGPU yet; always throws.
     * @inheritDoc
     */
    public createInspectTextureMipsRenderPipeline(_projectionViewBuffer: IUniformBuffer, _modelBuffer: IUniformBuffer, _textureConstantsBuffer: IUniformBuffer): IInspectTextureMipsRenderPipeline {
        throw new Error("WebGpuRenderPipelineFactory.createInspectTextureMipsRenderPipeline: the inspect texture mips render pipeline is not implemented for WebGPU yet.");
    }

    /**
     * Not implemented for WebGPU yet; always throws.
     * @inheritDoc
     */
    public createInspectTextureArrayRenderPipeline(_projectionViewBuffer: IUniformBuffer, _modelBuffer: IUniformBuffer, _fragmentDataBuffer: IUniformBuffer): IInspectTextureArrayRenderPipeline {
        throw new Error("WebGpuRenderPipelineFactory.createInspectTextureArrayRenderPipeline: the inspect texture array render pipeline (2D texture arrays) is not implemented for WebGPU yet.");
    }

    /**
     * Not implemented for WebGPU yet; always throws.
     * @inheritDoc
     */
    public createForwardBlinnPhongRenderPipeline(_descriptor: ForwardBlinnPhongRenderPipelineDescriptor): IForwardBlinnPhongRenderPipeline {
        throw new Error("WebGpuRenderPipelineFactory.createForwardBlinnPhongRenderPipeline: the forward Blinn-Phong render pipeline is not implemented for WebGPU yet.");
    }
}
