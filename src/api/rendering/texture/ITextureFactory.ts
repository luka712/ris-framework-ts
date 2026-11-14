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
     * Creates a 2D texture from explicit mip levels: `mipLevels[i]` is the pixel bytes of mip level `i`,
     * sized `max(1, width >> i)` x `max(1, height >> i)`. Useful to inspect mips, e.g. with {@link InspectTextureMipsMaterial}.
     * Works on WebGL2 and WebGPU. Compressed formats are not size-checked.
     * @param width - The width of mip level 0 in pixels. Must be greater than 0.
     * @param height - The height of mip level 0 in pixels. Must be greater than 0.
     * @param mipLevels - The bytes per mip level, starting at level 0. Must not be empty and must not have more levels than the full mip chain of `width` x `height`.
     * @param label - The label. By default, none.
     * @param usage - Texture usage. By default, COPY_DST | TEXTURE_BINDING.
     * @param textureFormat - The texture format. By default (or when UNDEFINED), the renderer's current {@link IRenderer.preferredTextureFormat}.
     * @returns The initialized texture with `mipLevels.length` mip levels.
     * @throws Error when `mipLevels` is empty or longer than the full mip chain, the size is 0,
     * or a level is shorter than `levelWidth * levelHeight * bytesPerPixel` (uncompressed formats only).
     */
    createWithMipLevels(width: number, height: number,
                        mipLevels: Uint8Array[],
                        label?: string,
                        usage?: TextureUsage,
                        textureFormat?: TextureFormat): ITexture2D;

    /**
     * Creates a 2D texture array from image data. Every layer has the same size and format.
     * Mipmap generation (`generateMipMaps`) works for RGBA8_UNORM and RGBA8_UNORM_SRGB on WebGL2 and WebGPU; on WebGPU it needs `TEXTURE_BINDING | RENDER_ATTACHMENT` usage.
     * On WebGPU, uploading data needs `COPY_DST` usage, and `HTMLImageElement` data also needs `RENDER_ATTACHMENT`.
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
     * Block-compressed formats are kept on WebGL2 and WebGPU when the device supports them (BC, ETC2 and ASTC; PVRTC arrays throw on WebGL2).
     *
     * Mipmaps: a file with more than one level uses its own levels. For a single-level file in an uncompressed format
     * (including Basis data transcoded to RGBA8), the full mip chain is generated on the GPU unless `generateMipmaps` is false.
     * A single-level block-compressed file keeps one level, as compressed formats can't be rendered to; passing `generateMipmaps` true then throws.
     * @param ktxTexture - The ktx2 texture. Transcoded in place when it holds Basis Universal data.
     * @param layers - The number of layers in the file. Must be greater than 0. A non-array KTX2 file has 1.
     * @param textureFormat - The desired texture format. By default, TextureFormat.UNDEFINED, which picks the format from the GPU features.
     * @param colorSpace - The color space override. By default, null, which follows the file.
     * @param label - The label. By default, the file path of the ktx2 texture.
     * @param generateMipmaps - Whether to generate mipmaps for a single-level file. By default, undefined: generate them for uncompressed formats only.
     * `true` also asks for them for compressed formats (throws); `false` never generates them.
     * @returns The initialized texture array.
     * @throws Error when `layers` is not greater than 0, the final texture format is not supported by the graphics device (or is PVRTC on WebGL2),
     * or `generateMipmaps` is true for a single-level block-compressed file.
     */
    createTexture2DArrayFromKtx2(ktxTexture: IKtx2Texture, layers: number, textureFormat?: TextureFormat, colorSpace?: ColorSpace | null, label?: string, generateMipmaps?: boolean): ITexture2DArray;
}
