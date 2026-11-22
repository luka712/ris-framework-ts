import { type IKtx2Texture, KtxDFTransfer, KtxTranscodeFlags, KtxTranscodeFormat, VkFormat } from "ris-ktx2";
import { vec2 } from "gl-matrix";
import type { ITextureFactory } from "./ITextureFactory.ts";
import type { IFramework } from "../../IFramework.ts";
import type { ITextureDescriptor } from "./ITextureDescriptor.ts";
import type { ITexture2D } from "./ITexture2D.ts";
import type { ITexture2DArray } from "./ITexture2DArray.ts";
import { ColorSpace } from "../enums.ts";
import { TextureFormat } from "./TextureFormat.ts";
import { TextureUtilities } from "./TextureUtilities.ts";
import { TextureUsage } from "./TextureUsage.ts";
import { Color } from "../../data/Color.ts";

/** The base texture factory. */
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
     * Creates the backend texture array (WebGL or WebGPU) from the descriptor and initializes it.
     * @param descriptor The texture descriptor, with `layers` and `dataArray`.
     * @returns The backend texture array.
     */
    protected abstract _createAndInitializeTexture2DArray(descriptor: ITextureDescriptor): ITexture2DArray;

    /**
     * Picks the final texture format of a KTX2 texture and transcodes Basis Universal data to it.
     * Shared by {@link createFromKtx2} and {@link createTexture2DArrayFromKtx2}.
     * @param ktxTexture The ktx2 texture. Transcoded in place when it holds Basis Universal data.
     * @param textureFormat The desired texture format. `TextureFormat.UNDEFINED` picks the format from the GPU features.
     * @param colorSpace The color space override. `null` follows the file.
     * @param method The calling method, used in error messages.
     * @returns The final texture format and its block size.
     * @throws Error when the final format is not supported by the graphics device, or its block size is unknown.
     * @protected
     */
    protected _resolveKtx2Format(ktxTexture: IKtx2Texture, textureFormat: TextureFormat, colorSpace: ColorSpace | null, method: string): { textureFormat: TextureFormat, blockSize: vec2 } {

        const vkFormat = ktxTexture.vkFormat;
        const requestedFormat = textureFormat;

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
            throw new Error(`ATextureFactory.${method}: texture format ${textureFormat} of '${ktxTexture.filePath}' is not supported by this graphics device (${this._framework.graphicsDevice.api}).`);
        }

        // After transcoding, the block size is the one of the transcoded format, not of the file's vkFormat.
        const finalVkFormat = transcodeFormat != KtxTranscodeFormat.NO_SELECTION
            ? TextureUtilities.convertKtxTranscodeFormatToVkFormat(transcodeFormat)
            : vkFormat;
        const blockSize = ktxTexture.getTextureFormatInfo(finalVkFormat);
        if (!blockSize) {
            throw new Error(`ATextureFactory.${method}: unknown block size for texture format ${textureFormat} (vkFormat ${finalVkFormat}) of '${ktxTexture.filePath}'.`);
        }

        return { textureFormat: textureFormat!, blockSize: vec2.fromValues(blockSize.blockWidth, blockSize.blockHeight) };
    }

    /** @inheritDoc */
    public createFromKtx2(ktxTexture: IKtx2Texture, textureFormat = TextureFormat.UNDEFINED, colorSpace: ColorSpace | null = null, generateMipmaps?: boolean): ITexture2D {

        const resolved = this._resolveKtx2Format(ktxTexture, textureFormat, colorSpace, "createFromKtx2");
        const label = ktxTexture.filePath;
        const singleLevel = ktxTexture.numLevels <= 1;
        const compressed = TextureUtilities.isCompressedTextureFormat(resolved.textureFormat);
        if (generateMipmaps === true && singleLevel && compressed) {
            throw new Error(`ATextureFactory.createFromKtx2: '${label ?? "unlabeled"}' has 1 mip level in block-compressed format ${resolved.textureFormat}; ` +
                `mipmaps can't be generated on the GPU for compressed formats. Store the mip levels in the KTX2 file, pick an uncompressed textureFormat, or pass generateMipmaps false.`);
        }
        const generate = (generateMipmaps ?? false) && singleLevel && !compressed;

        const data: Uint8Array[] = [];
        for (let i = 0; i < ktxTexture.numLevels; i++) {
            data.push(ktxTexture.getImage(i));
        }

        const textureDescriptor: ITextureDescriptor = {
            width: ktxTexture.width,
            height: ktxTexture.height,
            data,
            textureFormat: resolved.textureFormat,
            blockSize: resolved.blockSize,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
            generateMipmaps: generate,
            label
        };

        return this._createAndInitializeTexture(textureDescriptor);
    }

    /** @inheritDoc */
    public createTexture2DArrayFromKtx2(ktxTexture: IKtx2Texture, layers: number, textureFormat = TextureFormat.UNDEFINED, colorSpace: ColorSpace | null = null, label?: string, generateMipmaps?: boolean): ITexture2DArray {

        label = label ?? ktxTexture.filePath;
        if (!(layers > 0)) {
            throw new Error(`ATextureFactory.createTexture2DArrayFromKtx2: '${label ?? "unlabeled"}' has ${layers} layers; the layer count must be greater than 0.`);
        }

        const resolved = this._resolveKtx2Format(ktxTexture, textureFormat, colorSpace, "createTexture2DArrayFromKtx2");

        // Mipmaps are only generated for a single-level file. Block-compressed data can't be rendered to, so it keeps one level,
        // unless the caller explicitly asked for mipmaps.
        const singleLevel = ktxTexture.numLevels <= 1;
        const compressed = TextureUtilities.isCompressedTextureFormat(resolved.textureFormat);
        if (generateMipmaps === true && singleLevel && compressed) {
            throw new Error(`ATextureFactory.createTexture2DArrayFromKtx2: '${label ?? "unlabeled"}' has 1 mip level in block-compressed format ${resolved.textureFormat}; ` +
                `mipmaps can't be generated on the GPU for compressed formats. Store the mip levels in the KTX2 file, pick an uncompressed textureFormat, or pass generateMipmaps false.`);
        }
        const generate = (generateMipmaps ?? false) && singleLevel && !compressed;

        // One entry per layer, each with every mip level.
        const dataArray: Uint8Array[][] = [];
        for (let layer = 0; layer < layers; layer++) {
            const levels: Uint8Array[] = [];
            for (let level = 0; level < ktxTexture.numLevels; level++) {
                levels.push(ktxTexture.getImage(level, layer));
            }
            dataArray.push(levels);
        }

        const desc: ITextureDescriptor = {
            width: ktxTexture.width,
            height: ktxTexture.height,
            layers,
            dataArray,
            textureFormat: resolved.textureFormat,
            blockSize: resolved.blockSize,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
            generateMipmaps: generate,
            label,
        };

        return this._createAndInitializeTexture2DArray(desc);
    }

    /** @inheritdoc */
    public create(descriptor: ITextureDescriptor): ITexture2D {

        const label = descriptor.label;
        const width = descriptor.width ?? 0;
        const height = descriptor.height ?? 0;
        if (width == 0 || height == 0) {
            throw new Error(`ATextureFactory.create: '${label ?? "unlabeled"}' has size ${width}x${height}; width and height must be greater than 0.`);
        }

        let textureFormat = descriptor.textureFormat;
        if (textureFormat === undefined || textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        const textureUsage = descriptor.textureUsage ?? TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST;
        const generateMipmaps = descriptor.generateMipmaps ? true : false;
 
        const desc: ITextureDescriptor = {
            ...descriptor,
            width,
            height,
            textureFormat,
            textureUsage,
            generateMipmaps
        };

        return this._createAndInitializeTexture(desc);
    }

    /** @inheritDoc */
    public createWithMipLevels(width: number, height: number, mipLevels: Uint8Array[], label?: string,
        usage = TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING,
        textureFormat = TextureFormat.UNDEFINED): ITexture2D {
        if (textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }
        if (!(width > 0) || !(height > 0)) {
            throw new Error(`ATextureFactory.createWithMipLevels: '${label ?? "unlabeled"}' has size ${width}x${height}; width and height must be greater than 0.`);
        }
        const maxLevels = TextureUtilities.mipLevels(width, height);
        if (!mipLevels || mipLevels.length == 0 || mipLevels.length > maxLevels) {
            throw new Error(`ATextureFactory.createWithMipLevels: '${label ?? "unlabeled"}' has ${mipLevels?.length ?? 0} mip levels; ` +
                `a ${width}x${height} texture needs between 1 and ${maxLevels}.`);
        }

        const desc: ITextureDescriptor = {
            width,
            height,
            data: mipLevels,
            textureFormat,
            textureUsage: usage,
            label,
        };
        return this._createAndInitializeTexture(desc);
    }

    /** @inheritDoc */
    public createTexture2DArray(width: number, height: number, layer: number, data?: Uint8Array[][], label?: string, usage?: TextureUsage, textureFormat?: TextureFormat, generateMipmaps?: boolean): ITexture2DArray {
        if (textureFormat == undefined || textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        if (!data) {
            throw new Error(`ATextureFactory.createTexture2DArray: '${label ?? "unlabeled"}' has no data. Pass the data per layer, per mip level.`);
        }
        if (width == 0 || height == 0 || layer == 0) {
            throw new Error(`ATextureFactory.createTexture2DArray: '${label ?? "unlabeled"}' has size ${width}x${height} with ${layer} layers; width, height and layer must be greater than 0.`);
        }

        const desc: ITextureDescriptor = {
            width,
            height,
            layers: layer,
            dataArray: data,
            textureFormat,
            textureUsage: usage ,
            generateMipmaps: generateMipmaps,
            label: label ?? undefined,
        };

        return this._createAndInitializeTexture2DArray(desc);
    }

    /** @inheritdoc */
    public createEmpty(
        size: vec2,
        color: Color | null = null,
        textureUsage?: TextureUsage,
        textureFormat = TextureFormat.UNDEFINED,
        label: string | null = null,
        useMipmap = false,
        viewFormats?: TextureFormat[]): ITexture2D {

        const width = size[0];
        const height = size[1];

        if (width == 0 || height == 0) {
            throw new Error(`ATextureFactory.createEmpty: '${label ?? "unlabeled"}' has size ${width}x${height}; width and height must be greater than 0.`);
        }

        if (textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        let resolvedUsage = textureUsage;
        if (resolvedUsage === undefined) {
            resolvedUsage = TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING;
        }

        const desc: ITextureDescriptor = {
            width,
            height,
            textureUsage: resolvedUsage,
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
