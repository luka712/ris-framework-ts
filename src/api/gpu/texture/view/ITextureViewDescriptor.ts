import type {TextureFormat} from "../TextureFormat.ts";
import type { TextureViewDimension } from "../TextureViewDimension.ts";

/**
 * The texture view descriptor. It contains the parameters that are used to create a texture view.
 */
export interface ITextureViewDescriptor {

    /** The label of the texture view. By default, none. */
    label?: string;

    /** The texture view dimension. By default, the texture's dimension. */
    dimension?: TextureViewDimension;

    /** The texture format of the texture view. By default, the texture's own format. Must be one of the texture's `viewFormats`. */
    viewFormat?: TextureFormat;

    /** The first mip level of the view. By default, omitted: the default view includes every mip level. */
    baseMipLevel?: number;

    /** The number of mip levels in the view. By default, omitted. */
    mipLevelCount?: number;

    /** The first array layer of the view. By default, omitted. */
    baseArrayLayer?: number;

    /** The number of array layers in the view. By default, omitted. A value of 1 is a 2D view of one layer. */
    arrayLayerCount?: number;
}
