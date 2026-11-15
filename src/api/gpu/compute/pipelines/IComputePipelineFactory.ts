import type { IGpuCommandEncoder } from "../../IGpuCommandEncoder.ts";
import type { ITextureView2D } from "../../texture/view/ITextureView2D.ts";
import type { IDownsampleTextureComputePipeline } from "./IDownsampleTextureComputePipeline.ts";

/**
 * The compute pipeline factory.
 */
export interface IComputePipelineFactory {

    /**
     * Creates a pipeline that downsamples `source` into `destination`.
     * @param source The source view (mip level 0 of the view is read).
     * @param destination The destination view (mip level 0 of the view is written).
     * @returns The initialized downsample texture compute pipeline.
     */
    createDownsampleTexturePipeline(source: ITextureView2D, destination: ITextureView2D): IDownsampleTextureComputePipeline;
}
