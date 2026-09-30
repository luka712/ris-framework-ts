import {Color} from "../../data/Color";
import {TextureUsage} from "./TextureUsage";
import {TextureFormat} from "./TextureFormat";
import {ITexture2D} from "./ITexture2D";
import {TextureDescriptor} from "./TextureDescriptor";
import type {IKtx2Texture} from "ris-ktx2-api";

/**
 * The texture factory.
 */
export interface ITextureFactory {

    /**
     * Creates empty texture.
     * @param width The texture width.
     * @param height The texture height.
     * @param defaultColor The optional color.
     * @param textureUsage Texture usage.
     * @param textureFormat Texture format.
     * @param label The label.
     */
    createEmpty(
        width: number, height: number,
        defaultColor?: Color,
        textureUsage?: TextureUsage,
        textureFormat?: TextureFormat,
        label?: string): ITexture2D;

    /**
     * Creates a texture from image data.
     * @param width - The width of the image.
     * @param height - The height of the image.
     * @param data - The image data.
     * @param channels - The number of channels.
     * @param label - The label.
     * @param usage - Texture usage. By default, it is COPY_DST | TEXTURE_BINDING.
     * @param textureFormat - The texture format. By default, it is undefined. If so, the preferred texture format is used.
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
     * @param descriptor - The optional texture descriptor.
     * @returns The 2D texture.
     */
    createFromKtx2(ktxTexture: IKtx2Texture, descriptor?: TextureDescriptor): ITexture2D;
}
