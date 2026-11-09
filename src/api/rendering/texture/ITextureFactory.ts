import {Color} from "../../data/Color.ts";
import {TextureUsage} from "./TextureUsage.ts";
import {TextureFormat} from "./TextureFormat.ts";
import type { ITexture2D } from "./ITexture2D.ts";
import type {ITexture2DArray} from "./ITexture2DArray.ts";
import type {IKtx2Texture} from "ris-ktx2";
import { ColorSpace } from "../enums.ts";
import type {vec2} from "gl-matrix";

/**
 * The texture factory.
 */
export interface ITextureFactory {

    /**
     * Creates empty texture.
     * @param size The texture size [width, height] in pixels. Both must be greater than 0.
     * @param defaultColor The optional fill color. By default, none (black and none skip the upload).
     * @param textureUsage Texture usage. By default, `TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING`.
     * @param textureFormat Texture format. By default, `TextureFormat.UNDEFINED`, which uses the renderer's preferred texture format.
     * @param label The label. By default, none.
     * @param useMipmap Whether mipmaps are generated. By default, false.
     * @param viewFormats Extra formats the texture can be viewed as with {@link ITexture2D.getTextureView}
     * (e.g. RGBA8_UNORM_SRGB for an RGBA8_UNORM render target). By default, none (only the texture format).
     * @returns The initialized texture.
     * @throws Error when the width or height is 0.
     */
    createEmpty(
        size: vec2,
        defaultColor?: Color,
        textureUsage?: TextureUsage,
        textureFormat?: TextureFormat,
        label?: string,
        useMipmap?: boolean,
        viewFormats?: TextureFormat[]): ITexture2D;

    /**
     * Creates a texture from image data.
     * @param width - The width of the image in pixels. Must be greater than 0.
     * @param height - The height of the image in pixels. Must be greater than 0.
     * @param data - The image data: an image element, or the base level pixels (bytes). Required.
     * @param channels - The number of channels. Must be greater than 0. By default, 4.
     * @param label - The label. By default, none.
     * @param usage - Texture usage. By default, it is COPY_DST | TEXTURE_BINDING.
     * @param textureFormat - The texture format. By default (or when UNDEFINED), the renderer's current
     * {@link IRenderer.preferredTextureFormat} is used, so it follows {@link IRenderer.outputColorSpace}.
     * Pass {@link TextureFormat.RGBA8_UNORM} explicitly for raw data that must stay linear.
     * @param generateMipMaps - Indicates if texture should generate mipmap levels. By default, false.
     * @returns The initialized texture.
     * @throws Error when the data is missing, the size or channel count is 0, or byte data is shorter than
     * `width * height * bytesPerPixel`. The bytes per pixel come from the texture format (e.g. 4 for RGBA8), or from `channels`
     * when the format has no known size. Images and compressed formats are not size-checked.
     */
    create(width: number, height: number,
           data?: number[] | HTMLImageElement | ArrayBufferView,
           channels?: number,
           label?: string,
           usage?: TextureUsage,
           textureFormat?: TextureFormat,
           generateMipMaps?: boolean): ITexture2D;

    /**
     * Creates a 2D texture array from image data. Every layer has the same size and format.
     * Not implemented for WebGPU yet (throws).
     * @param width - The width of one layer in pixels. Must be greater than 0.
     * @param height - The height of one layer in pixels. Must be greater than 0.
     * @param layer - The number of layers. Must be greater than 0.
     * @param data - The image data per layer, per mip level (`data[layer][mipLevel]`). Required.
     * @param label - The label. By default, none.
     * @param usage - Texture usage. By default, it is COPY_DST | TEXTURE_BINDING.
     * @param textureFormat - The texture format. By default (or when UNDEFINED), the renderer's current
     * {@link IRenderer.preferredTextureFormat} is used, so it follows {@link IRenderer.outputColorSpace}.
     * Pass {@link TextureFormat.RGBA8_UNORM} explicitly for raw data that must stay linear.
     * @param generateMipMaps - Indicates if texture should generate mipmap levels. Only used when no layer provides more than one level. By default, false.
     * @returns The initialized texture array.
     * @throws Error when the data is missing, the size or layer count is 0, `data` has more layer entries than `layer`,
     * or a Uint8Array level is shorter than `width * height * bytesPerPixel` of its mip size (uncompressed formats only).
     * Fewer layer entries than `layer` are allowed; the remaining layers stay uninitialized.
     */
    createTexture2DArray(width: number, height: number, layer: number,
           data?: HTMLImageElement[][] | Uint8Array[][],
           label?: string,
           usage?: TextureUsage,
           textureFormat?: TextureFormat,
           generateMipMaps?: boolean): ITexture2DArray;

    /**
     * Create a texture from a KTX2 file.
     * @param ktxTexture - The ktx2 texture.
     * @param textureFormat - The desired texture format. By default, TextureFormat.UNDEFINED, which picks the format from the GPU features.
     * @param colorSpace - The color space override. By default, null, which follows the file: its DFD transfer function (sRGB or linear),
     * or, if unspecified, the file's vkFormat (non-transcoded) or linear (transcoded).
     * @returns The initialized 2D texture.
     * @throws Error when the final texture format is not supported by the graphics device.
     */
    createFromKtx2(ktxTexture: IKtx2Texture, textureFormat?: TextureFormat, colorSpace?: ColorSpace | null): ITexture2D;

    /**
     * Create a 2D texture array from a KTX2 file: one array layer per KTX2 layer, each with all mip levels.
     * The format and color space are picked the same way as {@link createFromKtx2}.
     * Compressed texture arrays are not implemented for WebGL2 yet, and texture arrays are not implemented for WebGPU yet (both throw).
     * @param ktxTexture - The ktx2 texture. Transcoded in place when it holds Basis Universal data.
     * @param layers - The number of layers in the file. Must be greater than 0. A non-array KTX2 file has 1.
     * @param textureFormat - The desired texture format. By default, TextureFormat.UNDEFINED, which picks the format from the GPU features.
     * @param colorSpace - The color space override. By default, null, which follows the file.
     * @param label - The label. By default, the file path of the ktx2 texture.
     * @returns The initialized texture array.
     * @throws Error when `layers` is not greater than 0, or the final texture format is not supported by the graphics device.
     */
    createTexture2DArrayFromKtx2(ktxTexture: IKtx2Texture, layers: number, textureFormat?: TextureFormat, colorSpace?: ColorSpace | null, label?: string): ITexture2DArray;
}
