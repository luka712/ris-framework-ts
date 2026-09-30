import {TextureFormat} from "./TextureFormat";
import {KtxTranscodeFormat, TextureFormatInfo, VkFormat} from "ris-ktx2-api";
import {AlignUtilities} from "../../utilities/AlignUtilities";

/**
 * The texture utilities.
 */
export class TextureUtilities {

    private static readonly _compressedTextureFormats = [
        TextureFormat.ASTC_4X4_RGBA,
        TextureFormat.BC3_RGBA_UNORM,
        TextureFormat.BC7_RGBA_UNORM,
        TextureFormat.ETC2_RGBA8_UNORM
    ];
    private static readonly _vkFormatTextureFormat: { [key: number]: number } = {
        [VkFormat.R8G8B8A8_UNORM]: TextureFormat.RGBA_8_UNORM,
        [VkFormat.R8G8B8A8_SRGB]: TextureFormat.RGBA_8_UNORM_SRGB,
        [VkFormat.BC7_UNORM_BLOCK]: TextureFormat.BC7_RGBA_UNORM,
        [VkFormat.ASTC_4X4_UNORM_BLOCK]: TextureFormat.ASTC_4X4_RGBA,
        [VkFormat.BC3_UNORM_BLOCK]: TextureFormat.BC3_RGBA_UNORM,
        [VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK]: TextureFormat.ETC2_RGBA8_UNORM,
    }

    private static readonly _textureFormatVkFormat: { [key: number]: number } = {
        [TextureFormat.RGBA_8_UNORM]: VkFormat.R8G8B8A8_UNORM,
        [TextureFormat.RGBA_8_UNORM_SRGB]: VkFormat.R8G8B8A8_SRGB,
        [TextureFormat.DEPTH_24_STENCIL_8]: VkFormat.D24_UNORM_S8_UINT,
        [TextureFormat.BC3_RGBA_UNORM]: VkFormat.BC3_UNORM_BLOCK,
        [TextureFormat.BC7_RGBA_UNORM]: VkFormat.BC7_UNORM_BLOCK,
        [TextureFormat.ASTC_4X4_RGBA]: VkFormat.ASTC_4X4_UNORM_BLOCK,
        [TextureFormat.ETC2_RGBA8_UNORM] : VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK,
    };

    private static readonly _mapTextureFormatKtxTranscodeFormat: { [key: number]: number } = {
        [TextureFormat.RGBA_8_UNORM]: KtxTranscodeFormat.RGBA32,
        [TextureFormat.ASTC_4X4_RGBA]: KtxTranscodeFormat.ASTC_4X4_RGBA,
        [TextureFormat.BC3_RGBA_UNORM]: KtxTranscodeFormat.BC3_RGBA,
        [TextureFormat.BC7_RGBA_UNORM]: KtxTranscodeFormat.BC7_RGBA,
        [TextureFormat.ETC2_RGBA8_UNORM]: KtxTranscodeFormat.ETC2_RGBA,
    };

    /**
     * Checks if the given texture format is a compressed texture format.
     * @param format - The texture format to check.
     * @returns true if a texture format is a compressed texture format.
     */
    public static isCompressedTextureFormat(format: TextureFormat): boolean {
        return this._compressedTextureFormats.indexOf(format) !== -1;
    }

    /**
     * Gets the number of mip levels for the given width and height.
     *
     * @param width The width.
     * @param height The height.
     * @returns The number of mip levels.
     */
    public static mipLevels(width: number, height: number): number {
        return Math.floor(Math.log2(Math.max(width, height))) + 1;
    }

    /**
     * Gets the number of         [TextureFormat.ETC2_RGBA8_UNORM] : VkFormat.ETC2_R8G8B8_UNORM_BLOCK,VRAM reserved for a given texture format of a given size.
     *
     * @param textureFormat The texture format.
     * @param width Texture width.
     * @param height Texture height.
     * @returns The number of bytes per pixel.
     */
    public static getVRamSize(textureFormat: TextureFormat, width: number, height: number): number {
        let vkFormat = this._textureFormatVkFormat[textureFormat];
        if (!vkFormat) {
            throw new Error(`Not implemented: ${textureFormat}`);
        }

        const texInfo = TextureFormatInfo.fromVkFormat(vkFormat);

        if(texInfo.blockWidth > 1){
            width = AlignUtilities.align(width, texInfo.blockWidth);
        }
        if(texInfo.blockHeight > 1){
            height = AlignUtilities.align(height, texInfo.blockHeight);
        }

        return width * height * texInfo.pixelSize;
    }

    /**
     * Converts the VkFormat to TextureFormat.
     * @param vkFormat The VK format.
     * @returns The texture format.
     */
    public static convertVkFormatToTextureFormat(vkFormat: VkFormat): TextureFormat {
        const format = this._vkFormatTextureFormat[vkFormat];
        if (!format) {
            throw new Error(`Not implemented: ${vkFormat}`);
        }
        return format;
    }

    /**
     * Maps the Texture Format to Ktx Transcode Format.
     * @param textureFormat The texture format.
     * @returns The Ktx Transcode Format.
     */
    public static convertTextureFormatToKtxTranscodeFormat(textureFormat: TextureFormat): KtxTranscodeFormat {
        const format = this._mapTextureFormatKtxTranscodeFormat[textureFormat];
        if (!format) {
            throw new Error(`Not implemented: ${textureFormat}`);
        }
        return format;
    }

}
