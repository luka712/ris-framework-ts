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
    IUnlitTextureArrayRenderPipeline,
} from "../../api/index.ts";
import {WebGpuMainRenderTargetRenderPipeline} from "./WebGpuMainRenderTargetRenderPipeline.ts";
import {WebGpuUnlitRenderPipeline} from "./material/WebGpuUnlitRenderPipeline.ts";
import {WebGpuUnlitTextureArrayRenderPipeline} from "./material/WebGpuUnlitTextureArrayRenderPipeline.ts";
import {WebGpuSpriteRenderPipeline} from "./sprite/WebGpuSpriteRenderPipeline.ts";
import {WebGpuInspectTextureArrayRenderPipeline} from "./inspect/WebGpuInspectTextureArrayRenderPipeline.ts";
import {WebGpuInspectTextureMipsRenderPipeline} from "./inspect/WebGpuInspectTextureMipsRenderPipeline.ts";

/**
 * The WebGPU render pipeline factory. Implements the main render target, unlit, unlit texture array, sprite, inspect texture mips and inspect texture array pipelines.
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
    public createUnlitTextureArrayRenderPipeline(projectionViewBuffer: IUniformBuffer,
                                                 modelBuffer: IUniformBuffer,
                                                 materialBuffer: IUniformBuffer,
                                                 primitiveState?: IPrimitiveState): IUnlitTextureArrayRenderPipeline {
        const pipeline = new WebGpuUnlitTextureArrayRenderPipeline(this._framework, projectionViewBuffer, modelBuffer, materialBuffer, primitiveState);
        pipeline.initialize();
        return pipeline;
    }

    /** @inheritDoc */
    public createSpriteRenderPipeline(projectionViewBuffer: IUniformBuffer): ISpriteRenderPipeline {
        const pipeline = new WebGpuSpriteRenderPipeline(this._framework, projectionViewBuffer);
        pipeline.initialize();
        return pipeline;
    }

    /** @inheritDoc */
    public createInspectTextureMipsRenderPipeline(projectionViewBuffer: IUniformBuffer, modelBuffer: IUniformBuffer, fragmentDataBuffer: IUniformBuffer): IInspectTextureMipsRenderPipeline {
        const pipeline = new WebGpuInspectTextureMipsRenderPipeline(this._framework, projectionViewBuffer, modelBuffer, fragmentDataBuffer);
        pipeline.initialize();
        return pipeline;
    }

    /** @inheritDoc */
    public createInspectTextureArrayRenderPipeline(projectionViewBuffer: IUniformBuffer, modelBuffer: IUniformBuffer, fragmentDataBuffer: IUniformBuffer): IInspectTextureArrayRenderPipeline {
        const pipeline = new WebGpuInspectTextureArrayRenderPipeline(this._framework, projectionViewBuffer, modelBuffer, fragmentDataBuffer);
        pipeline.initialize();
        return pipeline;
    }

    /**
     * Not implemented for WebGPU yet; always throws.
     * @inheritDoc
     */
    public createForwardBlinnPhongRenderPipeline(_descriptor: ForwardBlinnPhongRenderPipelineDescriptor): IForwardBlinnPhongRenderPipeline {
        throw new Error("WebGpuRenderPipelineFactory.createForwardBlinnPhongRenderPipeline: the forward Blinn-Phong render pipeline is not implemented for WebGPU yet.");
    }
}
