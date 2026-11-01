import {TextureFormat} from "./TextureFormat.ts";
import {KtxTranscodeFormat, TextureFormatInfo, VkFormat} from "ris-ktx2";
import {AlignUtilities} from "../../utilities/AlignUtilities.ts";

/**
 * The texture utilities.
 */
export class TextureUtilities {

    private static readonly _compressedTextureFormats = [

        // ASTC
        TextureFormat.ASTC_4X4_RGBA_UNORM,
        TextureFormat.ASTC_4X4_RGBA_SRGB,
        TextureFormat.ASTC_5X4_RGBA_UNORM,
        TextureFormat.ASTC_5X4_RGBA_SRGB,
        TextureFormat.ASTC_5X5_RGBA_UNORM,
        TextureFormat.ASTC_5X5_RGBA_SRGB,
        TextureFormat.ASTC_6X5_RGBA_UNORM,
        TextureFormat.ASTC_6X5_RGBA_SRGB,
        TextureFormat.ASTC_6X6_RGBA_UNORM,
        TextureFormat.ASTC_6X6_RGBA_SRGB,
        TextureFormat.ASTC_8X5_RGBA_UNORM,
        TextureFormat.ASTC_8X5_RGBA_SRGB,
        TextureFormat.ASTC_8X6_RGBA_UNORM,
        TextureFormat.ASTC_8X6_RGBA_SRGB,
        TextureFormat.ASTC_8X8_RGBA_UNORM,
        TextureFormat.ASTC_8X8_RGBA_SRGB,
        TextureFormat.ASTC_10X5_RGBA_UNORM,
        TextureFormat.ASTC_10X5_RGBA_SRGB,
        TextureFormat.ASTC_10X6_RGBA_UNORM,
        TextureFormat.ASTC_10X6_RGBA_SRGB,
        TextureFormat.ASTC_10X8_RGBA_UNORM,
        TextureFormat.ASTC_10X8_RGBA_SRGB,
        TextureFormat.ASTC_10X10_RGBA_UNORM,
        TextureFormat.ASTC_10X10_RGBA_SRGB,
        TextureFormat.ASTC_12X10_RGBA_UNORM,
        TextureFormat.ASTC_12X10_RGBA_SRGB,
        TextureFormat.ASTC_12X12_RGBA_UNORM,
        TextureFormat.ASTC_12X12_RGBA_SRGB,

        // PVRTC
        TextureFormat.PVRTC_4BPPV1_RGBA,
        TextureFormat.PVRTC_4BPPV1_RGB,
        TextureFormat.PVRTC_2BPPV1_RGBA,
        TextureFormat.PVRTC_2BPPV1_RGB,

        TextureFormat.BC3_RGBA_UNORM,
        TextureFormat.BC7_RGBA_UNORM,
        TextureFormat.ETC2_RGBA8_UNORM,

        // sRGB and RGB variants
        TextureFormat.BC7_RGBA_SRGB,
        TextureFormat.BC3_RGBA_SRGB,
        TextureFormat.BC1_RGB_UNORM,
        TextureFormat.BC1_RGB_SRGB,
        TextureFormat.ETC2_RGBA8_SRGB,
        TextureFormat.ETC2_RGB8_UNORM,
        TextureFormat.ETC2_RGB8_SRGB,
    ];

    /** Linear compressed format → its sRGB variant. */
    private static readonly _srgbVariant: { [key: string]: TextureFormat } = {
        [TextureFormat.RGBA_8_UNORM]: TextureFormat.RGBA_8_UNORM_SRGB,
        [TextureFormat.BC7_RGBA_UNORM]: TextureFormat.BC7_RGBA_SRGB,
        [TextureFormat.BC3_RGBA_UNORM]: TextureFormat.BC3_RGBA_SRGB,
        [TextureFormat.BC1_RGB_UNORM]: TextureFormat.BC1_RGB_SRGB,
        [TextureFormat.ETC2_RGBA8_UNORM]: TextureFormat.ETC2_RGBA8_SRGB,
        [TextureFormat.ETC2_RGB8_UNORM]: TextureFormat.ETC2_RGB8_SRGB,
        [TextureFormat.ASTC_4X4_RGBA_UNORM]: TextureFormat.ASTC_4X4_RGBA_SRGB,
        [TextureFormat.ASTC_5X4_RGBA_UNORM]: TextureFormat.ASTC_5X4_RGBA_SRGB,
        [TextureFormat.ASTC_5X5_RGBA_UNORM]: TextureFormat.ASTC_5X5_RGBA_SRGB,
        [TextureFormat.ASTC_6X5_RGBA_UNORM]: TextureFormat.ASTC_6X5_RGBA_SRGB,
        [TextureFormat.ASTC_6X6_RGBA_UNORM]: TextureFormat.ASTC_6X6_RGBA_SRGB,
        [TextureFormat.ASTC_8X5_RGBA_UNORM]: TextureFormat.ASTC_8X5_RGBA_SRGB,
        [TextureFormat.ASTC_8X6_RGBA_UNORM]: TextureFormat.ASTC_8X6_RGBA_SRGB,
        [TextureFormat.ASTC_8X8_RGBA_UNORM]: TextureFormat.ASTC_8X8_RGBA_SRGB,
        [TextureFormat.ASTC_10X5_RGBA_UNORM]: TextureFormat.ASTC_10X5_RGBA_SRGB,
        [TextureFormat.ASTC_10X6_RGBA_UNORM]: TextureFormat.ASTC_10X6_RGBA_SRGB,
        [TextureFormat.ASTC_10X8_RGBA_UNORM]: TextureFormat.ASTC_10X8_RGBA_SRGB,
        [TextureFormat.ASTC_10X10_RGBA_UNORM]: TextureFormat.ASTC_10X10_RGBA_SRGB,
        [TextureFormat.ASTC_12X10_RGBA_UNORM]: TextureFormat.ASTC_12X10_RGBA_SRGB,
        [TextureFormat.ASTC_12X12_RGBA_UNORM]: TextureFormat.ASTC_12X12_RGBA_SRGB,
    };
    private static readonly _vkFormatTextureFormat: { [key: number]: TextureFormat } = {
        [VkFormat.R8G8B8A8_UNORM]: TextureFormat.RGBA_8_UNORM,
        [VkFormat.R8G8B8A8_SRGB]: TextureFormat.RGBA_8_UNORM_SRGB,
        [VkFormat.BC7_UNORM_BLOCK]: TextureFormat.BC7_RGBA_UNORM,

        // ASTC
        [VkFormat.ASTC_4X4_UNORM_BLOCK]: TextureFormat.ASTC_4X4_RGBA_UNORM,
        [VkFormat.ASTC_4X4_SRGB_BLOCK]: TextureFormat.ASTC_4X4_RGBA_SRGB,
        [VkFormat.ASTC_5X4_UNORM_BLOCK]: TextureFormat.ASTC_5X4_RGBA_UNORM,
        [VkFormat.ASTC_5X4_SRGB_BLOCK]: TextureFormat.ASTC_5X4_RGBA_SRGB,
        [VkFormat.ASTC_5X5_UNORM_BLOCK]: TextureFormat.ASTC_5X5_RGBA_UNORM,
        [VkFormat.ASTC_5X5_SRGB_BLOCK]: TextureFormat.ASTC_5X5_RGBA_SRGB,
        [VkFormat.ASTC_6X5_UNORM_BLOCK]: TextureFormat.ASTC_6X5_RGBA_UNORM,
        [VkFormat.ASTC_6X5_SRGB_BLOCK]: TextureFormat.ASTC_6X5_RGBA_SRGB,
        [VkFormat.ASTC_6X6_UNORM_BLOCK]: TextureFormat.ASTC_6X6_RGBA_UNORM,
        [VkFormat.ASTC_6X6_SRGB_BLOCK]: TextureFormat.ASTC_6X6_RGBA_SRGB,
        [VkFormat.ASTC_8X5_UNORM_BLOCK]: TextureFormat.ASTC_8X5_RGBA_UNORM,
        [VkFormat.ASTC_8X5_SRGB_BLOCK]: TextureFormat.ASTC_8X5_RGBA_SRGB,
        [VkFormat.ASTC_8X6_UNORM_BLOCK]: TextureFormat.ASTC_8X6_RGBA_UNORM,
        [VkFormat.ASTC_8X6_SRGB_BLOCK]: TextureFormat.ASTC_8X6_RGBA_SRGB,
        [VkFormat.ASTC_8X8_UNORM_BLOCK]: TextureFormat.ASTC_8X8_RGBA_UNORM,
        [VkFormat.ASTC_8X8_SRGB_BLOCK]: TextureFormat.ASTC_8X8_RGBA_SRGB,
        [VkFormat.ASTC_10X5_UNORM_BLOCK]: TextureFormat.ASTC_10X5_RGBA_UNORM,
        [VkFormat.ASTC_10X5_SRGB_BLOCK]: TextureFormat.ASTC_10X5_RGBA_SRGB,
        [VkFormat.ASTC_10X6_UNORM_BLOCK]: TextureFormat.ASTC_10X6_RGBA_UNORM,
        [VkFormat.ASTC_10X6_SRGB_BLOCK]: TextureFormat.ASTC_10X6_RGBA_SRGB,
        [VkFormat.ASTC_10X8_UNORM_BLOCK]: TextureFormat.ASTC_10X8_RGBA_UNORM,
        [VkFormat.ASTC_10X8_SRGB_BLOCK]: TextureFormat.ASTC_10X8_RGBA_SRGB,
        [VkFormat.ASTC_10X10_UNORM_BLOCK]: TextureFormat.ASTC_10X10_RGBA_UNORM,
        [VkFormat.ASTC_10X10_SRGB_BLOCK]: TextureFormat.ASTC_10X10_RGBA_SRGB,
        [VkFormat.ASTC_12X10_UNORM_BLOCK]: TextureFormat.ASTC_12X10_RGBA_UNORM,
        [VkFormat.ASTC_12X10_SRGB_BLOCK]: TextureFormat.ASTC_12X10_RGBA_SRGB,
        [VkFormat.ASTC_12X12_UNORM_BLOCK]: TextureFormat.ASTC_12X12_RGBA_UNORM,
        [VkFormat.ASTC_12X12_SRGB_BLOCK]: TextureFormat.ASTC_12X12_RGBA_SRGB,

        [VkFormat.BC3_UNORM_BLOCK]: TextureFormat.BC3_RGBA_UNORM,
        [VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK]: TextureFormat.ETC2_RGBA8_UNORM,
        [VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG]: TextureFormat.PVRTC_4BPPV1_RGBA,

        // sRGB and RGB variants
        [VkFormat.BC7_SRGB_BLOCK]: TextureFormat.BC7_RGBA_SRGB,
        [VkFormat.BC3_SRGB_BLOCK]: TextureFormat.BC3_RGBA_SRGB,
        [VkFormat.BC1_RGB_UNORM_BLOCK]: TextureFormat.BC1_RGB_UNORM,
        [VkFormat.BC1_RGB_SRGB_BLOCK]: TextureFormat.BC1_RGB_SRGB,
        [VkFormat.ETC2_R8G8B8A8_SRGB_BLOCK]: TextureFormat.ETC2_RGBA8_SRGB,
        [VkFormat.ETC2_R8G8B8_UNORM_BLOCK]: TextureFormat.ETC2_RGB8_UNORM,
        [VkFormat.ETC2_R8G8B8_SRGB_BLOCK]: TextureFormat.ETC2_RGB8_SRGB,

    }

    private static readonly _textureFormatVkFormat: { [key: string]: number } = {
        [TextureFormat.RGBA_8_UNORM]: VkFormat.R8G8B8A8_UNORM,
        [TextureFormat.RGBA_8_UNORM_SRGB]: VkFormat.R8G8B8A8_SRGB,
        [TextureFormat.DEPTH_24_STENCIL_8]: VkFormat.D24_UNORM_S8_UINT,
        [TextureFormat.BC3_RGBA_UNORM]: VkFormat.BC3_UNORM_BLOCK,
        [TextureFormat.BC7_RGBA_UNORM]: VkFormat.BC7_UNORM_BLOCK,

        // ASTC
        [TextureFormat.ASTC_4X4_RGBA_UNORM]: VkFormat.ASTC_4X4_UNORM_BLOCK,
        [TextureFormat.ASTC_4X4_RGBA_SRGB]: VkFormat.ASTC_4X4_SRGB_BLOCK,
        [TextureFormat.ASTC_5X4_RGBA_UNORM]: VkFormat.ASTC_5X4_UNORM_BLOCK,
        [TextureFormat.ASTC_5X4_RGBA_SRGB]: VkFormat.ASTC_5X4_SRGB_BLOCK,
        [TextureFormat.ASTC_5X5_RGBA_UNORM]: VkFormat.ASTC_5X5_UNORM_BLOCK,
        [TextureFormat.ASTC_5X5_RGBA_SRGB]: VkFormat.ASTC_5X5_SRGB_BLOCK,
        [TextureFormat.ASTC_6X5_RGBA_UNORM]: VkFormat.ASTC_6X5_UNORM_BLOCK,
        [TextureFormat.ASTC_6X5_RGBA_SRGB]: VkFormat.ASTC_6X5_SRGB_BLOCK,
        [TextureFormat.ASTC_6X6_RGBA_UNORM]: VkFormat.ASTC_6X6_UNORM_BLOCK,
        [TextureFormat.ASTC_6X6_RGBA_SRGB]: VkFormat.ASTC_6X6_SRGB_BLOCK,
        [TextureFormat.ASTC_8X5_RGBA_UNORM]: VkFormat.ASTC_8X5_UNORM_BLOCK,
        [TextureFormat.ASTC_8X5_RGBA_SRGB]: VkFormat.ASTC_8X5_SRGB_BLOCK,
        [TextureFormat.ASTC_8X6_RGBA_UNORM]: VkFormat.ASTC_8X6_UNORM_BLOCK,
        [TextureFormat.ASTC_8X6_RGBA_SRGB]: VkFormat.ASTC_8X6_SRGB_BLOCK,
        [TextureFormat.ASTC_8X8_RGBA_UNORM]: VkFormat.ASTC_8X8_UNORM_BLOCK,
        [TextureFormat.ASTC_8X8_RGBA_SRGB]: VkFormat.ASTC_8X8_SRGB_BLOCK,
        [TextureFormat.ASTC_10X5_RGBA_UNORM]: VkFormat.ASTC_10X5_UNORM_BLOCK,
        [TextureFormat.ASTC_10X5_RGBA_SRGB]: VkFormat.ASTC_10X5_SRGB_BLOCK,
        [TextureFormat.ASTC_10X6_RGBA_UNORM]: VkFormat.ASTC_10X6_UNORM_BLOCK,
        [TextureFormat.ASTC_10X6_RGBA_SRGB]: VkFormat.ASTC_10X6_SRGB_BLOCK,
        [TextureFormat.ASTC_10X8_RGBA_UNORM]: VkFormat.ASTC_10X8_UNORM_BLOCK,
        [TextureFormat.ASTC_10X8_RGBA_SRGB]: VkFormat.ASTC_10X8_SRGB_BLOCK,
        [TextureFormat.ASTC_10X10_RGBA_UNORM]: VkFormat.ASTC_10X10_UNORM_BLOCK,
        [TextureFormat.ASTC_10X10_RGBA_SRGB]: VkFormat.ASTC_10X10_SRGB_BLOCK,
        [TextureFormat.ASTC_12X10_RGBA_UNORM]: VkFormat.ASTC_12X10_UNORM_BLOCK,
        [TextureFormat.ASTC_12X10_RGBA_SRGB]: VkFormat.ASTC_12X10_SRGB_BLOCK,
        [TextureFormat.ASTC_12X12_RGBA_UNORM]: VkFormat.ASTC_12X12_UNORM_BLOCK,
        [TextureFormat.ASTC_12X12_RGBA_SRGB]: VkFormat.ASTC_12X12_SRGB_BLOCK,

        // PVRTC
        [TextureFormat.PVRTC_4BPPV1_RGBA]: VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG,
        [TextureFormat.PVRTC_4BPPV1_RGB]: VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG,
        [TextureFormat.PVRTC_2BPPV1_RGBA]: VkFormat.PVRTC1_2BPP_UNORM_BLOCK_IMG,
        [TextureFormat.PVRTC_2BPPV1_RGB]: VkFormat.PVRTC1_2BPP_UNORM_BLOCK_IMG,


        [TextureFormat.ETC2_RGBA8_UNORM] : VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK,

        // sRGB and RGB variants
        [TextureFormat.BC7_RGBA_SRGB]: VkFormat.BC7_SRGB_BLOCK,
        [TextureFormat.BC3_RGBA_SRGB]: VkFormat.BC3_SRGB_BLOCK,
        [TextureFormat.BC1_RGB_UNORM]: VkFormat.BC1_RGB_UNORM_BLOCK,
        [TextureFormat.BC1_RGB_SRGB]: VkFormat.BC1_RGB_SRGB_BLOCK,
        [TextureFormat.ETC2_RGBA8_SRGB]: VkFormat.ETC2_R8G8B8A8_SRGB_BLOCK,
        [TextureFormat.ETC2_RGB8_UNORM]: VkFormat.ETC2_R8G8B8_UNORM_BLOCK,
        [TextureFormat.ETC2_RGB8_SRGB]: VkFormat.ETC2_R8G8B8_SRGB_BLOCK,
    };

    private static readonly _mapTextureFormatKtxTranscodeFormat: { [key: string]: number } = {
        [TextureFormat.RGBA_8_UNORM]: KtxTranscodeFormat.RGBA32,
        [TextureFormat.ASTC_4X4_RGBA_UNORM]: KtxTranscodeFormat.ASTC_4X4_RGBA,
        [TextureFormat.BC3_RGBA_UNORM]: KtxTranscodeFormat.BC3_RGBA,
        [TextureFormat.BC7_RGBA_UNORM]: KtxTranscodeFormat.BC7_RGBA,
        [TextureFormat.ETC2_RGBA8_UNORM]: KtxTranscodeFormat.ETC2_RGBA,
        [TextureFormat.PVRTC_4BPPV1_RGBA] : KtxTranscodeFormat.PVRTC1_4_RGBA,
        [TextureFormat.PVRTC_4BPPV1_RGB] : KtxTranscodeFormat.PVRTC1_4_RGB,
        // Basis transcodes to the same blocks for sRGB; only the GPU format differs.
        [TextureFormat.RGBA_8_UNORM_SRGB]: KtxTranscodeFormat.RGBA32,
        [TextureFormat.ASTC_4X4_RGBA_SRGB]: KtxTranscodeFormat.ASTC_4X4_RGBA,
        [TextureFormat.BC3_RGBA_SRGB]: KtxTranscodeFormat.BC3_RGBA,
        [TextureFormat.BC7_RGBA_SRGB]: KtxTranscodeFormat.BC7_RGBA,
        [TextureFormat.ETC2_RGBA8_SRGB]: KtxTranscodeFormat.ETC2_RGBA,
    };

    private static readonly _mapKtxTranscodeFormatVkFormat: { [key: number]: number } = {
        [KtxTranscodeFormat.ETC1_RGB]: VkFormat.ETC2_R8G8B8_UNORM_BLOCK,
        [KtxTranscodeFormat.ETC2_RGBA]: VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK,
        [KtxTranscodeFormat.BC1_RGB]: VkFormat.BC1_RGB_UNORM_BLOCK,
        [KtxTranscodeFormat.BC3_RGBA]: VkFormat.BC3_UNORM_BLOCK,
        [KtxTranscodeFormat.BC4_R]: VkFormat.BC4_UNORM_BLOCK,
        [KtxTranscodeFormat.BC5_RG]: VkFormat.BC5_UNORM_BLOCK,
        [KtxTranscodeFormat.BC7_RGBA]: VkFormat.BC7_UNORM_BLOCK,
        [KtxTranscodeFormat.PVRTC1_4_RGB]: VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG,
        [KtxTranscodeFormat.PVRTC1_4_RGBA]: VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG,
        [KtxTranscodeFormat.ASTC_4X4_RGBA]: VkFormat.ASTC_4X4_UNORM_BLOCK,
        [KtxTranscodeFormat.RGBA32]: VkFormat.R8G8B8A8_UNORM,
        [KtxTranscodeFormat.RGB565]: VkFormat.R5G6B5_UNORM_PACK16,
        [KtxTranscodeFormat.BGR565]: VkFormat.B5G6R5_UNORM_PACK16,
        [KtxTranscodeFormat.RGBA4444]: VkFormat.R4G4B4A4_UNORM_PACK16,
        [KtxTranscodeFormat.PVRTC2_4_RGB]: VkFormat.PVRTC2_4BPP_UNORM_BLOCK_IMG,
        [KtxTranscodeFormat.PVRTC2_4_RGBA]: VkFormat.PVRTC2_4BPP_UNORM_BLOCK_IMG,
        [KtxTranscodeFormat.ETC2_EAC_R11]: VkFormat.EAC_R11_UNORM_BLOCK,
        [KtxTranscodeFormat.ETC2_EAC_RG11]: VkFormat.EAC_R11G11_UNORM_BLOCK,
    };

    /** sRGB format → its linear variant. */
    private static readonly _linearVariant: { [key: string]: TextureFormat } = Object.fromEntries(
        Object.entries(TextureUtilities._srgbVariant).map(([linear, srgb]) => [srgb, linear as TextureFormat])
    );

    /** Every sRGB format. */
    private static readonly _srgbFormats: TextureFormat[] = Object.values(TextureUtilities._srgbVariant);

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
     * Gets the number of VRAM reserved for a given texture format of a given size.
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

    /**
     * Converts the Ktx Transcode Format to VkFormat.
     * @param transcodeFormat The KTX transcode format.
     * @returns The VkFormat.
     */
    public static convertKtxTranscodeFormatToVkFormat(transcodeFormat: KtxTranscodeFormat): VkFormat {
        const format = this._mapKtxTranscodeFormatVkFormat[transcodeFormat];
        if (!format) {
            throw new Error(`Not implemented: ${transcodeFormat}`);
        }
        return format;
    }

    /**
     * Maps the linear format to the srgb variant.
     * @param textureFormat The linear format.
     * @return The srgb variant, or the format itself if it is already sRGB or has no sRGB variant (e.g. PVRTC).
     */
    public static convertToSrgbVariant(textureFormat: TextureFormat) : TextureFormat {
        return this._srgbVariant[textureFormat] ?? textureFormat;
    }

    /**
     * Maps the srgb format to the linear variant.
     * @param textureFormat The srgb format.
     * @return The linear variant, or the format itself if it is already linear.
     */
    public static convertToLinearVariant(textureFormat: TextureFormat) : TextureFormat {
        return this._linearVariant[textureFormat] ?? textureFormat;
    }

    /**
     * Checks whether the texture format is an sRGB format.
     * @param textureFormat The texture format to check.
     * @return True if srgb texture format.
     */
    public static isSrgbFormat(textureFormat: TextureFormat) : boolean {
        return this._srgbFormats.includes(textureFormat);
    }

    /**
     * Returns the requested format if it is the file's format or its sRGB/linear variant.
     * @param fileFormat The format the data is stored in.
     * @param requested The explicitly requested format.
     * @throws If the requested format cannot reinterpret the data.
     */
    public static resolveExplicitFormat(fileFormat: TextureFormat, requested: TextureFormat): TextureFormat {
        if (requested == fileFormat
            || requested == TextureUtilities.convertToSrgbVariant(fileFormat)
            || requested == TextureUtilities.convertToLinearVariant(fileFormat)) {
            return requested;
        }
        throw new Error(`Texture format ${requested} is not compatible with the file's format ${fileFormat}; only its sRGB or linear variant can be used.`);
    }
}
