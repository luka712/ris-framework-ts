import {
    Color,
    type IFramework,
    type ITexture2D,
    type ITextureDescriptor,
    type ITextureFactory,
    TextureFormat,
    TextureUsage,
    TextureUtilities
} from "../../api/index.ts"
import {WebGlTexture2D} from "./WebGlTexture2D.ts";
import {type IKtx2Texture, KtxTranscodeFlags, KtxTranscodeFormat, VkFormat} from "ris-ktx2";
import {vec2} from "gl-matrix";
import {ColorSpace} from "../../api/rendering/enums.ts";
import {resolveTextureDescriptor} from "../../core/rendering/texture/TextureDescriptorUtilities.ts";

export class WebGlTextureFactory implements ITextureFactory {

    /**
     * The constructor for the WebGlTextureFactory class.
     * @param _framework The framework instance.
     */
    constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createFromKtx2(ktxTexture: IKtx2Texture, descriptor?: ITextureDescriptor): ITexture2D {
        const desc = resolveTextureDescriptor(descriptor);
        const vkFormat = ktxTexture.vkFormat;

        // Ktx2 will have different cases, for now we consider simple 2d case.
        const numLevels = ktxTexture.numLevels;
        let transcodeFormat = KtxTranscodeFormat.NO_SELECTION;
        let textureFormat = desc.textureFormat;
        const gpuFeatures = this._framework.graphicsDevice.features;

        // Textures always adapt to the framework's preferred color space, unless user defined it's preferred.
        const preferSrgb = (descriptor?.preferredColorSpace ?? this._framework.renderer.colorSpace) == ColorSpace.SRGB;
        // An explicit texture format overrides both color space preferences.
        const userSpecifiedTextureFormat = desc.textureFormat != TextureFormat.UNDEFINED;

        if (ktxTexture.needsTranscoding && vkFormat == VkFormat.UNDEFINED)
        {
            // If descriptor format is UNDEFINED, we will use format according to the GPU features.
            if(desc.textureFormat == TextureFormat.UNDEFINED)
            {
                // BC7 needs BPTC (supportsTextureCompressionBC), BC3 needs S3TC.
                if(gpuFeatures.supportsTextureCompressionBC)
                {
                    transcodeFormat = KtxTranscodeFormat.BC7_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.BC7_RGBA_SRGB : TextureFormat.BC7_RGBA_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionASTC)
                {
                    transcodeFormat = KtxTranscodeFormat.ASTC_4X4_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.ASTC_4X4_RGBA_SRGB : TextureFormat.ASTC_4X4_RGBA_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionS3TC)
                {
                    transcodeFormat = KtxTranscodeFormat.BC3_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.BC3_RGBA_SRGB : TextureFormat.BC3_RGBA_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionETC2)
                {
                    transcodeFormat = KtxTranscodeFormat.ETC2_RGBA;
                    textureFormat = preferSrgb ? TextureFormat.ETC2_RGBA8_SRGB : TextureFormat.ETC2_RGBA8_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionPVRTC)
                {
                    transcodeFormat = KtxTranscodeFormat.PVRTC1_4_RGBA;
                    // Does not have SRGB equivalent.
                    textureFormat = TextureFormat.PVRTC_4BPPV1_RGBA;
                }
                else
                {
                    transcodeFormat = KtxTranscodeFormat.RGBA32;
                    textureFormat = preferSrgb ? TextureFormat.RGBA_8_UNORM_SRGB : TextureFormat.RGBA_8_UNORM;
                }
            }
            else
            {
                transcodeFormat = TextureUtilities.convertTextureFormatToKtxTranscodeFormat(textureFormat);
            }

            ktxTexture.transcodeBasis(transcodeFormat, KtxTranscodeFlags.HIGH_QUALITY);
        }
        else {
            // No transcoding path: map the vkFormat, then switch to the preferred color space variant.
            textureFormat = TextureUtilities.convertVkFormatToTextureFormat(vkFormat);

            if (userSpecifiedTextureFormat) {
                // The data can only be reinterpreted as the file's format or its sRGB/linear variant.
                textureFormat = TextureUtilities.resolveExplicitFormat(textureFormat, desc.textureFormat);
            } else {
                if (preferSrgb && !TextureUtilities.isSrgbFormat(textureFormat)) {
                    textureFormat = TextureUtilities.convertToSrgbVariant(textureFormat);
                } else if (!preferSrgb && TextureUtilities.isSrgbFormat(textureFormat)) {
                    textureFormat = TextureUtilities.convertToLinearVariant(textureFormat);
                }
            }
        }

        const blockSize = ktxTexture.getTextureFormatInfo(ktxTexture.vkFormat);
        if (!blockSize) {
            throw new Error(`Unknown block size for texture format ${textureFormat}.`);
        }

        const data: Uint8Array[] = [];
        for (let i = 0; i < numLevels; i++)
        {
            data.push(ktxTexture.getImage(i));
        }

        const textureDescriptor = resolveTextureDescriptor({
            ...desc,
            width: ktxTexture.width,
            height: ktxTexture.height,
            data,
            textureFormat,
            blockSize: vec2.fromValues(blockSize.blockWidth, blockSize.blockHeight),
        });

        const texture = new WebGlTexture2D(this._framework, textureDescriptor);
        texture.initialize();
        return texture;
    }

    /** @inheritdoc */
    public create(
        width: number, height: number,
        data?: Uint8Array | HTMLImageElement,
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

        const desc = resolveTextureDescriptor({
            width,
            height,
            // @ts-ignore HTMLImageElement is uploaded as-is by WebGlTexture2D.
            data: [data],
            textureFormat,
            textureUsage,
            generateMipmaps: useMipMaps,
            label,
        });

        const texture = new WebGlTexture2D(
            this._framework,
         desc
        );

        texture.initialize();
        return texture;
    }

    /** @inheritdoc */
    public createEmpty(
        width: number, height: number,
        color: Color | null = null,
        textureUsage = TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING,
        textureFormat = TextureFormat.UNDEFINED,
        label: string | null = null,
        useMipmap = false): ITexture2D {

        if (width == 0 || height == 0) {
            throw new Error("Width and height must be greater than 0.");
        }

        if (textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        const desc = resolveTextureDescriptor({
            width,
            height,
            textureUsage,
            textureFormat,
            label,
            generateMipmaps: useMipmap,
        });

        // Fast path: avoid generating & uploading a big CPU-side buffer when not needed.
        if (!color || color.equals(Color.black())) {
            const texture = new WebGlTexture2D(
                this._framework,
               desc
            );

            texture.initialize();
            return texture;
        }

        // Fill CPU-side pixels in RGBA order. WebGL uploads these bytes as gl.RGBA.
        const byteSize = width * height * 4;
        const bytes = new Uint8Array(byteSize);

        for (let i = 0; i < byteSize; i += 4) {
            bytes[i] = color.r * 255;
            bytes[i + 1] = color.g * 255;
            bytes[i + 2] = color.b * 255;
            bytes[i + 3] = color.a * 255;
        }

        return this.create( width, height, bytes, 4, label, textureUsage, textureFormat, useMipmap );
    }
}
