import {Color} from "../../data/Color.ts";
import {TextureUsage} from "./TextureUsage.ts";
import {TextureFormat} from "./TextureFormat.ts";
import type { ITexture2D } from "./ITexture2D.ts";
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
     * @param width - The width of the image.
     * @param height - The height of the image.
     * @param data - The image data.
     * @param channels - The number of channels.
     * @param label - The label.
     * @param usage - Texture usage. By default, it is COPY_DST | TEXTURE_BINDING.
     * @param textureFormat - The texture format. By default (or when UNDEFINED), the renderer's current
     * {@link IRenderer.preferredTextureFormat} is used, so it follows {@link IRenderer.outputColorSpace}.
     * Pass {@link TextureFormat.RGBA8_UNORM} explicitly for raw data that must stay linear.
     * @param generateMipMaps - Indicates if texture should generate mipmap levels.
     * @returns The texture.
     */
    create(width: number, height: number,
           data?: number[] | HTMLImageElement | ArrayBufferView,
           channels?: number,
           label?: string,
           usage?: TextureUsage,
           textureFormat?: TextureFormat,
           generateMipMaps?: boolean): ITexture2D;

    /**
     * Create a texture from a KTX2 file.
     * @param ktxTexture - The ktx2 texture.
     * @param textureFormat - The desired texture format. By default, TextureFormat.UNDEFINED, which picks the format from the GPU features.
     * @param colorSpace - The color space override. By default, null, which follows the file: its DFD transfer function (sRGB or linear),
     * or, if unspecified, the file's vkFormat (non-transcoded) or linear (transcoded).
     * @returns The 2D texture.
     */
    createFromKtx2(ktxTexture: IKtx2Texture, textureFormat?: TextureFormat, colorSpace?: ColorSpace | null): ITexture2D;
}
