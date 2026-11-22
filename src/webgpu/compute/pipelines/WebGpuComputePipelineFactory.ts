import type { IComputePipelineFactory, IFramework, ITextureView2D, IDownsampleTextureComputePipeline } from "../../../api";
import { WebGpuDownsampleTextureComputePipeline } from "./WebGpuDownsampleTextureComputePipeline";


/**
 * The WebGPU compute pipeline factory.
 * @internal
 */
export class WebGpuComputePipelineFactory implements IComputePipelineFactory {

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createDownsampleTexturePipeline(source: ITextureView2D, destination: ITextureView2D): IDownsampleTextureComputePipeline {
        const pipeline = new WebGpuDownsampleTextureComputePipeline(this._framework);
        pipeline.initialize();
        pipeline.source = source;
        pipeline.target = destination;
        return pipeline;
    }

    /** @inheritdoc */
    public async createDownsampleTexturePipelineAsync(): Promise<IDownsampleTextureComputePipeline> {
        const pipeline = new WebGpuDownsampleTextureComputePipeline(this._framework);
        await pipeline.initializeAsync();
        return pipeline;
    }

}
