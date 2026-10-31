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
import {type IKtx2Texture, KtxTranscodeFlags, KtxTranscodeFormat, VkFormat} from "ris-ktx2";
import {vec2} from "gl-matrix";

export class WebGlTextureFactory implements ITextureFactory {

    /**
     * The constructor for the WebGlTextureFactory class.
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

        if (ktxTexture.needsTranscoding && vkFormat == VkFormat.UNDEFINED)
        {
            // If descriptor format is UNDEFINED, we will use format according to the GPU features.
            if(descriptor.textureFormat == TextureFormat.UNDEFINED)
            {
                // BC7 needs BPTC (supportsTextureCompressionBC), BC3 needs S3TC.
                if(gpuFeatures.supportsTextureCompressionBC)
                {
                    transcodeFormat = KtxTranscodeFormat.BC7_RGBA;
                    textureFormat = TextureFormat.BC7_RGBA_UNORM;
                }
                else if(gpuFeatures.supportsTextureCompressionASTC)
                {
                    transcodeFormat = KtxTranscodeFormat.ASTC_4X4_RGBA;
                    textureFormat = TextureFormat.ASTC_4X4_RGBA_UNORM
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
                else if(gpuFeatures.supportsTextureCompressionPVRTC)
                {
                    transcodeFormat = KtxTranscodeFormat.PVRTC1_4_RGBA;
                    textureFormat = TextureFormat.PVRTC_4BPPV1_RGBA;
                }
                else
                {
                    transcodeFormat = KtxTranscodeFormat.RGBA32;
                    textureFormat = TextureFormat.RGBA_8_UNORM;
                }
            }
            else
            {
                transcodeFormat = TextureUtilities.convertTextureFormatToKtxTranscodeFormat(textureFormat);
            }

            ktxTexture.transcodeBasis(transcodeFormat, KtxTranscodeFlags.HIGH_QUALITY);

            // After transcoding, libktx reports the sRGB vkFormat when the file's DFD transfer function is sRGB.
            if (descriptor.textureFormat == TextureFormat.UNDEFINED && WebGlTextureFactory._isSrgbVkFormat(ktxTexture.vkFormat))
            {
                textureFormat = TextureUtilities.toSrgbFormat(textureFormat);
            }
        }
        else {
            // No transcoding path, the vkFormat already says linear or sRGB.
            textureFormat = TextureUtilities.convertVkFormatToTextureFormat(vkFormat);
        }

        textureFormat = this._ensureSrgbSupported(textureFormat, ktxTexture.filePath);

        const blockSize = TextureUtilities.getBlockSize(textureFormat);
        if (!blockSize) {
            throw new Error(`Unknown block size for texture format ${textureFormat}.`);
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
        textureDescriptor.blockSize = vec2.fromValues(blockSize[0], blockSize[1]);

        const texture = new WebGlTexture2D(this._framework, textureDescriptor);
        texture.initialize();
        return texture;
    }

    /** Whether the Vulkan format is an sRGB format. */
    private static _isSrgbVkFormat(vkFormat: VkFormat): boolean {
        const name = (VkFormat as unknown as Record<number, string>)[vkFormat];
        return typeof name === "string" && name.includes("_SRGB");
    }

    /**
     * Falls back to the linear variant (with a warning) when the GPU cannot sample the sRGB format.
     * Only S3TC sRGB (BC1/BC3) has its own WebGL extension; BC7, ETC2 and ASTC sRGB ship with their base extension.
     */
    private _ensureSrgbSupported(textureFormat: TextureFormat, source?: string): TextureFormat {
        const isS3tcSrgb = textureFormat === TextureFormat.BC3_RGBA_SRGB || textureFormat === TextureFormat.BC1_RGB_SRGB;
        if (isS3tcSrgb && !this._framework.graphicsDevice.features.supportsTextureCompressionS3TCSrgb) {
            const linear = TextureUtilities.toLinearFormat(textureFormat);
            console.warn(`sRGB S3TC is not supported (WEBGL_compressed_texture_s3tc_srgb missing); ` +
                `loading ${source ?? "texture"} as ${linear}. Colours will look washed out.`);
            return linear;
        }
        return textureFormat;
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
