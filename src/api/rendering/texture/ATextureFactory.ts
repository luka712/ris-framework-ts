import { type IKtx2Texture, KtxDFTransfer, KtxTranscodeFlags, KtxTranscodeFormat, VkFormat } from "ris-ktx2";
import { vec2 } from "gl-matrix";
import type { ITextureFactory } from "./ITextureFactory.ts";
import type { IFramework } from "../../IFramework.ts";
import type { ITextureDescriptor } from "./ITextureDescriptor.ts";
import type { ITexture2D } from "./ITexture2D.ts";
import { ColorSpace } from "../enums.ts";
import { TextureFormat } from "./TextureFormat.ts";
import { TextureUtilities } from "./TextureUtilities.ts";
import { TextureUsage } from "./TextureUsage.ts";
import { Color } from "../../data/Color.ts";

/** The base texture factory implementation */
export abstract class ATextureFactory implements ITextureFactory {

    /**
     * The constructor.
     * @param _framework The framework instance.
     */
    constructor(protected readonly _framework: IFramework) {
    }

    /**
     * Creates the backend texture (WebGL or WebGPU) from the descriptor and initializes it.
     * @param descriptor The texture descriptor.
     * @returns The backend texture.
     */
    protected abstract _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D;

    /**
     * Create a texture from a KTX2 file.
     * @param ktxTexture The ktx2 texture.
     * @param textureFormat The desired texture format. By default, TextureFormat.UNDEFINED, which picks the format from the GPU features.
     * @param colorSpace The color space override. By default, null, which follows the file: its DFD transfer function (sRGB or linear),
     * or, if unspecified, the file's vkFormat (non-transcoded) or linear (transcoded).
     * @returns The 2D texture.
     */
    public createFromKtx2(ktxTexture: IKtx2Texture, textureFormat = TextureFormat.UNDEFINED, colorSpace: ColorSpace | null = null): ITexture2D {

        const vkFormat = ktxTexture.vkFormat;
        const requestedFormat = textureFormat;

        // Ktx2 will have different cases, for now we consider simple 2d case.
        const numLevels = ktxTexture.numLevels;
        let transcodeFormat = KtxTranscodeFormat.NO_SELECTION;
        const gpuFeatures = this._framework.graphicsDevice.features;

        // An explicit color space wins; otherwise follow the file's DFD transfer function (null = not specified by the file).
        const oetf = ktxTexture.oetf;
        const fileSrgb: boolean | null = oetf == KtxDFTransfer.SRGB ? true : oetf == KtxDFTransfer.LINEAR ? false : null;
        const requestedSrgb: boolean | null = colorSpace != null ? colorSpace == ColorSpace.SRGB : fileSrgb;
        const preferSrgb = requestedSrgb ?? false;

        const userSpecifiedTextureFormat = textureFormat != TextureFormat.UNDEFINED;

        if (ktxTexture.needsTranscoding && vkFormat == VkFormat.UNDEFINED) {
            // If the format is UNDEFINED, we will use format according to the GPU features.
            if (!userSpecifiedTextureFormat) {
                // BC7 needs BPTC (supportsTextureCompressionBC), BC3 needs S3TC.
                if (gpuFeatures.supportsTextureCompressionBC) {
                    transcodeFormat = KtxTranscodeFormat.BC7_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.BC7_RGBA_UNORM_SRGB : TextureFormat.BC7_RGBA_UNORM;
                }
                else if (gpuFeatures.supportsTextureCompressionASTC) {
                    transcodeFormat = KtxTranscodeFormat.ASTC_4X4_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.ASTC_4X4_UNORM_SRGB : TextureFormat.ASTC_4X4_UNORM;
                }
                else if (gpuFeatures.supportsTextureCompressionS3TC) {
                    transcodeFormat = KtxTranscodeFormat.BC3_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.BC3_RGBA_UNORM_SRGB : TextureFormat.BC3_RGBA_UNORM;
                }
                else if (gpuFeatures.supportsTextureCompressionETC2) {
                    transcodeFormat = KtxTranscodeFormat.ETC2_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.ETC2_RGBA8_UNORM_SRGB : TextureFormat.ETC2_RGBA8_UNORM;
                }
                else if (gpuFeatures.supportsTextureCompressionPVRTC) {
                    transcodeFormat = KtxTranscodeFormat.PVRTC1_4_RGBA;
                    // Does not have SRGB equivalent.
                    textureFormat = TextureFormat.PVRTC1_RGBA_4BPP_UNORM;
                }
                else {
                    transcodeFormat = KtxTranscodeFormat.RGBA32;
                    textureFormat = preferSrgb ? TextureFormat.RGBA8_UNORM_SRGB : TextureFormat.RGBA8_UNORM;
                }
            }
            else {
                transcodeFormat = TextureUtilities.convertTextureFormatToKtxTranscodeFormat(textureFormat!);
            }

            ktxTexture.transcodeBasis(transcodeFormat, KtxTranscodeFlags.HIGH_QUALITY);
        }
        else {
            // No transcoding path: map the vkFormat, then switch to the requested color space variant (override, else the file's DFD).
            const fileFormat = TextureUtilities.convertVkFormatToTextureFormat(vkFormat);

            textureFormat = userSpecifiedTextureFormat ? requestedFormat : fileFormat;

            if (!userSpecifiedTextureFormat && requestedSrgb != null) {
                if (requestedSrgb && !TextureUtilities.isSrgbFormat(textureFormat)) {
                    textureFormat = TextureUtilities.convertToSrgbVariant(textureFormat);
                } else if (!requestedSrgb && TextureUtilities.isSrgbFormat(textureFormat)) {
                    textureFormat = TextureUtilities.convertToLinearVariant(textureFormat);
                }
            }
        }

        // The device must support the final format (the file's format, or the transcode target).
        if (!gpuFeatures.supportsTextureFormat(textureFormat!)) {
            throw new Error(`Texture format ${textureFormat} of '${ktxTexture.filePath}' is not supported by this graphics device.`);
        }

        // After transcoding, the block size is the one of the transcoded format, not of the file's vkFormat.
        const finalVkFormat = transcodeFormat != KtxTranscodeFormat.NO_SELECTION
            ? TextureUtilities.convertKtxTranscodeFormatToVkFormat(transcodeFormat)
            : vkFormat;
        const blockSize = ktxTexture.getTextureFormatInfo(finalVkFormat);
        if (!blockSize) {
            throw new Error(`Unknown block size for texture format ${textureFormat}.`);
        }

        const data: Uint8Array[] = [];
        for (let i = 0; i < numLevels; i++) {
            data.push(ktxTexture.getImage(i));
        }

        const textureDescriptor: ITextureDescriptor = {
            width: ktxTexture.width,
            height: ktxTexture.height,
            data,
            textureFormat,
            blockSize: vec2.fromValues(blockSize.blockWidth, blockSize.blockHeight),
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
            label: ktxTexture.filePath
        };

        return this._createAndInitializeTexture(textureDescriptor);
    }

    /** @inheritdoc */
    public create(
        width: number, height: number,
        data?: number[] | HTMLImageElement | ArrayBufferView,
        channels: number = 4,
        label: string | null | undefined = null,
        textureUsage = TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING,
        textureFormat = TextureFormat.UNDEFINED,
        useMipMaps = false): ITexture2D {

        if (textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        if (!data) {
            throw new Error("Data must not be null.");
        }
        if (width == 0 || height == 0) {
            throw new Error("width and height must be greater than 0.");
        }

        if (channels == 0) {
            throw new Error("channels must be greater than 0.");
        }

        // Images are uploaded as-is; pixel data is passed as bytes.
        let levelData: Uint8Array[] | HTMLImageElement[];
        if (typeof HTMLImageElement !== "undefined" && data instanceof HTMLImageElement) {
            levelData = [data];
        } else if (Array.isArray(data)) {
            levelData = [new Uint8Array(data)];
        } else {
            const view = data as ArrayBufferView;
            levelData = [new Uint8Array(view.buffer, view.byteOffset, view.byteLength)];
        }

        const desc: ITextureDescriptor = {
            width,
            height,
            data: levelData,
            textureFormat,
            textureUsage,
            generateMipmaps: useMipMaps,
            label: label ?? undefined,
        };

        return this._createAndInitializeTexture(desc);
    }

    /** @inheritdoc */
    public createEmpty(
        size: vec2,
        color: Color | null = null,
        textureUsage = TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING,
        textureFormat = TextureFormat.UNDEFINED,
        label: string | null = null,
        useMipmap = false,
        viewFormats?: TextureFormat[]): ITexture2D {

        const width = size[0];
        const height = size[1];

        if (width == 0 || height == 0) {
            throw new Error("Width and height must be greater than 0.");
        }

        if (textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        const desc: ITextureDescriptor = {
            width,
            height,
            textureUsage,
            textureFormat,
            label: label ?? undefined,
            generateMipmaps: useMipmap,
            viewFormats,
        };

        // Fast path: avoid generating & uploading a big CPU-side buffer when not needed.
        if (!color || color.equals(Color.black())) {
            return this._createAndInitializeTexture(desc);
        }

        // Fill CPU-side pixels in RGBA order.
        const byteSize = width * height * 4;
        const bytes = new Uint8Array(byteSize);

        for (let i = 0; i < byteSize; i += 4) {
            bytes[i] = color.r * 255;
            bytes[i + 1] = color.g * 255;
            bytes[i + 2] = color.b * 255;
            bytes[i + 3] = color.a * 255;
        }

        desc.data = [bytes];
        return this._createAndInitializeTexture(desc);
    }
}
