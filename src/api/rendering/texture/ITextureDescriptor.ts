import type {TextureFormat} from "./TextureFormat.ts";
import type {TextureUsage} from "./TextureUsage.ts";
import type {vec2} from "gl-matrix";
import type {ColorSpace} from "../enums.ts";

/**
 * The texture descriptor. Every field is optional; factories fill in the defaults for missing fields.
 */
export interface ITextureDescriptor {

    /**
     * The texture width.
     * By default, it is 0.
     */
    width?: number;

    /**
     * The texture height.
     * By default, it is 0.
     */
    height?: number;

    /**
     * The texture format. When loading texture preferred format can be set.
     * This overrides framework preferred color space when loading or ktx2 transcoding.
     * By default, it is UNDEFINED.
     */
    textureFormat?: TextureFormat;

    /**
     * The view formats to use for texture view.
     * In WebGPU view formats define which view formats can be used.
     * WebGL2 does not support texture views (`supportsTextureView` is false); `viewFormats` other than the texture format are only usable on WebGPU.
     * The texture format itself is always a valid view format.
     * By default, undefined (only the texture format).
     */
    viewFormats?: TextureFormat[];

    /** The preferred color space. By default, undefined: KTX2 files follow their own color space, other images use the renderer's outputColorSpace (SRGB → sRGB formats, NONE → linear formats). */
    preferredColorSpace?: ColorSpace;

    /**
     * The texture usage.
     * By default, it is TEXTURE_BINDING | COPY_DST.
     */
    textureUsage?: TextureUsage;

    /** The texture label. */
    label?: string;

    /**
     * The data per mip level.
     * By default, it is undefined.
     */
    data?: Uint8Array[] | HTMLImageElement[];

    /**
     * Should mipmaps be generated.
     * By default, it is false.
     */
    generateMipmaps?: boolean;

    /**
     * The block size of a texture, which must be set for compressed textures.
     * By default, it is undefined.
     */
    blockSize?: vec2;
}
