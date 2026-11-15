import type { ITextureView2D } from "../../texture/view/ITextureView2D.ts";
import type { IComputePipeline } from "./IComputePipeline.ts";

/**
 * A compute pipeline that downsamples a texture view into another, including generating a mip chain from mip level 0.
 * Only `RGBA8_UNORM` and `RGBA8_UNORM_SRGB` are supported. sRGB textures are converted to linear space for the downsample.
 */
export interface IDownsampleTextureComputePipeline extends IComputePipeline {

    /** The source view (mip level 0 of the view is read). */
    source: ITextureView2D;

    /** The destination view (mip level 0 of the view is written). */
    target: ITextureView2D;
}
