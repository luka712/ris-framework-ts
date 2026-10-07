import {
    Color,
    type IFramework,
    type ITexture2D,
    type ITextureFactory,
    TextureDescriptor,
    TextureFormat,
    TextureUsage,
    TextureUtilities
} from "../../api/index.ts"
import {WebGlTexture2D} from "./WebGlTexture2D.ts";
import {type IKtx2Texture, KtxTranscodeFlags, KtxTranscodeFormat, TextureFormatInfo, VkFormat} from "ris-ktx2-api";
import {vec2} from "gl-matrix";

export class WebGlTextureFactory implements ITextureFactory {

    /**
     * The constructor for the WebGLTextureFactory class.
     * @param _framework The framework instance.
     */
    constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createFromKtx2(ktxTexture: IKtx2Texture, descriptor?: TextureDescriptor): ITexture2D {
        descriptor = descriptor ?? new TextureDescriptor();
        const vkFormat = ktxTexture.vkFormat;

        // Ktx2 will have different cases, for now we consider simple 2d case.
        const numLevels = ktxTexture.numLevels;
        let transcodeFormat = KtxTranscodeFormat.NO_SELECTION;
        let textureFormat = descriptor.textureFormat;
        const gpuFeatures = this._framework.graphicsDevice.features;
        let texFormatInfo: TextureFormatInfo | null = null;

        if (ktxTexture.needsTranscoding && vkFormat == VkFormat.UNDEFINED)
        {
            // If descriptor format is UNDEFINED, we will use format according to the GPU features.
            if(descriptor.textureFormat == TextureFormat.UNDEFINED)
            {
                if(gpuFeatures.supportsTextureCompressionBC)
                {
                    transcodeFormat = KtxTranscodeFormat.BC7_RGBA;
                    textureFormat = TextureFormat.BC7_RGBA_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionASTC)
                {
                    transcodeFormat = KtxTranscodeFormat.ASTC_4X4_RGBA;
                    textureFormat = TextureFormat.ASTC_4X4_RGBA
                }
                else if(gpuFeatures.supportsTextureCompressionS3TC)
                {
                    transcodeFormat = KtxTranscodeFormat.BC3_RGBA;
                    textureFormat = TextureFormat.BC3_RGBA_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionETC2)
                {
                    transcodeFormat = KtxTranscodeFormat.ETC2_RGBA;
                    textureFormat = TextureFormat.ETC2_RGBA8_UNORM;
                }
                else
                {
                    // NO_SELECTION is not a transcode target, and
                    // convertKtxTranscodeFormatToVkFormat throws on it.
                    transcodeFormat = KtxTranscodeFormat.RGBA32;
                    textureFormat = TextureFormat.RGBA_8_UNORM;
                }
            }
            else
            {
                // Returns only RGBA32, ASTC_4X4_RGBA, BC3_RGBA, BC7_RGBA, or
                // ETC2_RGBA. convertKtxTranscodeFormatToVkFormat accepts each
                // of those. It throws for KTX_TTF_ETC, BC1_OR_3, and
                // NO_SELECTION, which this helper does not return. Any other
                // descriptor format throws from this call and is not transcoded.
                transcodeFormat = TextureUtilities.convertTextureFormatToKtxTranscodeFormat(textureFormat);
            }

            ktxTexture.transcodeBasis(transcodeFormat, KtxTranscodeFlags.HIGH_QUALITY);
            texFormatInfo = ktxTexture.getTextureFormatInfo(TextureUtilities.convertKtxTranscodeFormatToVkFormat(transcodeFormat));
        }
        else {
            // No transcoding path, but still get info about the texture format.
            textureFormat = TextureUtilities.convertVkFormatToTextureFormat(vkFormat);
            texFormatInfo = ktxTexture.getTextureFormatInfo(vkFormat);
        }

        const data: Uint8Array[] = [];
        for (let i = 0; i < numLevels; i++)
        {
            data.push(ktxTexture.getImage(i));
        }

        const textureDescriptor = new TextureDescriptor();
        textureDescriptor.width = ktxTexture.width;
        textureDescriptor.height = ktxTexture.height;
        textureDescriptor.data = data;
        textureDescriptor.textureFormat = textureFormat;
        textureDescriptor.generateMipmaps = descriptor.generateMipmaps;
        textureDescriptor.blockSize = vec2.fromValues(texFormatInfo.blockWidth, texFormatInfo.blockHeight);

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
        textureFormat= TextureFormat.RGBA_8_UNORM,
        useMipMaps = false): ITexture2D {

        if (!data) {
            throw new Error("Data must not be null.");
        }
        if (width == 0 || height == 0) {
            throw new Error("width and height must be greater than 0.");
        }

        if (channels == 0) {
            throw new Error("channels must be greater than 0.");
        }

        const desc = new TextureDescriptor();
        desc.width = width;
        desc.height = height;
        // @ts-ignore
        desc.data = data ? [data] : null;
        desc.textureFormat = textureFormat;
        desc.textureUsage = textureUsage;
        desc.generateMipmaps = useMipMaps;
        desc.label = label;

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

        const desc = new TextureDescriptor();
        desc.width = width;
        desc.height = height;
        desc.textureUsage = textureUsage;
        desc.textureFormat = textureFormat;
        desc.label = label;
        desc.generateMipmaps = useMipmap;

        // Fast path: avoid generating & uploading a big CPU-side buffer when not needed.
        if (!color || color.equals(Color.black())) {
            const texture = new WebGlTexture2D(
                this._framework,
               desc
            );

            texture.initialize();
            return texture;
        }

        // Fill CPU-side pixels (BGRA layout to match TextureFormat.BGRA_8_Unorm usage elsewhere).
        const byteSize = width * height * 4;
        const bytes = new Uint8Array(byteSize);

        for (let i = 0; i < byteSize; i += 4) {
            bytes[i + 0] = color.b * 255;
            bytes[i + 1] = color.g * 255;
            bytes[i + 2] = color.r * 255;
            bytes[i + 3] = color.a * 255;
        }

        return this.create( width, height, bytes, 4, label, textureUsage, textureFormat, useMipmap );
    }
}
