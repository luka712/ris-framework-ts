import {
    Color,
    type IFramework,
    type ITexture2D,
    type ITextureFactory,
    type ITextureDescriptor,
    TextureFormat,
    TextureUsage,
} from "../../api/index.ts";
import type {IKtx2Texture} from "ris-ktx2";
import {WebGpuTexture2D} from "./WebGpuTexture2D.ts";
import {resolveTextureDescriptor} from "../../core/rendering/texture/TextureDescriptorUtilities.ts";

/**
 * The WebGPU texture factory.
 * @internal
 */
export class WebGpuTextureFactory implements ITextureFactory {

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createFromKtx2(_ktxTexture: IKtx2Texture, _descriptor?: ITextureDescriptor): ITexture2D {
        throw new Error("createFromKtx2 is not implemented for WebGPU.");
    }

    /** @inheritDoc */
    public create(
        width: number, height: number,
        data?: number[] | HTMLImageElement | ArrayBufferView,
        channels: number = 4,
        label: string | null | undefined = null,
        textureUsage = TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING,
        textureFormat = TextureFormat.UNDEFINED,
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
        if (textureFormat == TextureFormat.UNDEFINED) {
            textureFormat = this._framework.renderer.preferredTextureFormat;
        }

        const desc = resolveTextureDescriptor({
            width,
            height,
            textureFormat,
            textureUsage,
            generateMipmaps: useMipMaps,
            label: label ?? null,
        });

        let image: HTMLImageElement | undefined;
        if (typeof HTMLImageElement !== "undefined" && data instanceof HTMLImageElement) {
            image = data;
        } else if (Array.isArray(data)) {
            desc.data = [new Uint8Array(data)];
        } else {
            const view = data as ArrayBufferView;
            desc.data = [new Uint8Array(view.buffer, view.byteOffset, view.byteLength)];
        }

        const texture = new WebGpuTexture2D(this._framework, desc, image);
        texture.initialize();
        return texture;
    }

    /** @inheritDoc */
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

        // WebGPU zero-initializes textures, so transparent black needs no upload; neither do depth textures.
        if (!color || (color.r === 0 && color.g === 0 && color.b === 0 && color.a === 0)) {
            const texture = new WebGpuTexture2D(this._framework, desc);
            texture.initialize();
            return texture;
        }

        const byteSize = width * height * 4;
        const bytes = new Uint8Array(byteSize);
        for (let i = 0; i < byteSize; i += 4) {
            bytes[i] = color.r * 255;
            bytes[i + 1] = color.g * 255;
            bytes[i + 2] = color.b * 255;
            bytes[i + 3] = color.a * 255;
        }
        return this.create(width, height, bytes, 4, label, textureUsage, textureFormat, useMipmap);
    }
}
