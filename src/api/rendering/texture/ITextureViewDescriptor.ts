import type {TextureFormat} from "./TextureFormat.ts";

/**
 * The texture view descriptor. It contains the parameters that are used to create a texture view.
 * Views are always 2D (`TextureViewDimension.DIMENSION_2D`) for now.
 */
export interface ITextureViewDescriptor {

    /** The label of the texture view. By default, none. */
    label?: string;

    /** The texture format of the texture view. Required; must be one of the texture's `viewFormats`. */
    viewFormat: TextureFormat;
}
