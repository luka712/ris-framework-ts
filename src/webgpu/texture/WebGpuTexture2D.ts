import {
    type IFramework,
    State,
    TextureUsage,
    TextureUtilities,
    type ITextureView,
    TextureViewDescriptor,
    TextureViewDimension,
    type ITextureDescriptor,
} from "../../api/index.ts";
import {ATexture2D} from "../../core/rendering/texture/texture.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";
import {WebGpuTextureView} from "./WebGpuTextureView.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU 2D texture.
 *
 * Supports `Uint8Array` mip levels (uncompressed or compressed, e.g. from KTX2) or an `HTMLImageElement` as `data[0]`.
 * Mipmap generation and compressed (KTX2) formats are not implemented for WebGPU yet.
 * @internal
 */
export class WebGpuTexture2D extends ATexture2D {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _image?: HTMLImageElement;
    private _gpuTexture: GPUTexture | null = null;
    private _gpuDefaultView: GPUTextureView | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The texture descriptor.
     */
    public constructor(framework: IFramework, descriptor: ITextureDescriptor) {
        super(descriptor);
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        const first = descriptor.data?.[0];
        if (typeof HTMLImageElement !== "undefined" && first instanceof HTMLImageElement) {
            this._image = first;
        }
    }

    /** The WebGPU texture. */
    public get gpuTexture(): GPUTexture {
        if (!this._gpuTexture) {
            throw new Error("WebGpuTexture2D: the texture is not initialized or is disposed.");
        }
        return this._gpuTexture;
    }

    /** The default WebGPU view of the whole texture. */
    public get gpuDefaultView(): GPUTextureView {
        if (!this._gpuDefaultView) {
            throw new Error("WebGpuTexture2D: the texture is not initialized or is disposed.");
        }
        return this._gpuDefaultView;
    }

    /** @inheritDoc */
    public initialize(): void {
        if (this._state == State.INITIALIZED) {
            throw new Error("Texture is already initialized.");
        } else if (this._state == State.DISPOSED) {
            throw new Error("Texture is already disposed.");
        }

        const isCompressed = TextureUtilities.isCompressedTextureFormat(this.textureFormat);
        if (this._generateMipMaps && !isCompressed) {
            console.warn("WebGpuTexture2D: mipmap generation is not implemented for WebGPU; only the base level is used.");
            this._generateMipMaps = false;
        }

        const hasData = !this._image && !!this._data && this._data.length > 0;
        let usage = WebGpuConverter.convertTextureUsage(this.textureUsage);
        // Uploading needs COPY_DST; copyExternalImageToTexture also needs RENDER_ATTACHMENT.
        if (hasData || this._image) {
            usage |= GPUTextureUsage.COPY_DST;
        }
        if (this._image) {
            usage |= GPUTextureUsage.RENDER_ATTACHMENT;
        }

        const device = this._graphicsDevice.device;
        // Compressed formats need a block-aligned base size (e.g. ASTC 10x5 at 768x512 -> 770x515).
        // The copies below use the logical mip sizes rounded up to whole blocks, which stay within the physical mips.
        const [gpuWidth, gpuHeight] = isCompressed
            ? WebGpuUtilities.texture.alignSizeToBlock(this.width, this.height, this._blockSize[0], this._blockSize[1])
            : [this.width, this.height];
        this._gpuTexture = WebGpuUtilities.texture.create(
            device, gpuWidth, gpuHeight,
            WebGpuConverter.convertTextureFormat(this.textureFormat),
            usage, this._mipLevels, 1,
            this.label ?? `WebGpuTexture2D ${this.id}`);

        if (this._image) {
            WebGpuUtilities.texture.writeImageToTexture(device.queue, this._gpuTexture, this._image, this.width, this.height);
        } else if (hasData) {
            let width = this.width;
            let height = this.height;
            const levels = this._data as Uint8Array[];
            for (let level = 0; level < levels.length; level++) {
                if (isCompressed) {
                    WebGpuUtilities.texture.writeCompressedToTexture(device.queue, this._gpuTexture, levels[level],
                        width, height, this._blockSize[0], this._blockSize[1],
                        TextureUtilities.getVRamSize(this.textureFormat, this._blockSize[0], this._blockSize[1]), level);
                } else {
                    const bytesPerPixel = TextureUtilities.getVRamSize(this.textureFormat, 1, 1);
                    WebGpuUtilities.texture.writeToTexture(device.queue, this._gpuTexture, levels[level], width, height, bytesPerPixel, level);
                }
                width = Math.max(1, Math.floor(width / 2));
                height = Math.max(1, Math.floor(height / 2));
            }
        }

        this._gpuDefaultView = WebGpuUtilities.textureView.create(this._gpuTexture, {label: `${this.label ?? "WebGpuTexture2D"} default view`});
        // ATexture2D declares the default view readonly and sets it to null; fill it in here.
        (this as { defaultTextureView: ITextureView }).defaultTextureView =
            new WebGpuTextureView(this._gpuDefaultView, this.textureFormat);
        this._handle = this._gpuTexture;

        this._state = State.INITIALIZED;

        let width = this.width;
        let height = this.height;
        this._size = 0;
        for (let i = 0; i < this.mipLevels; i++) {
            this._size += TextureUtilities.getVRamSize(this.textureFormat, width, height);
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }
    }

    /** @inheritDoc */
    public createView(descriptor?: TextureViewDescriptor): ITextureView {
        descriptor = descriptor ?? new TextureViewDescriptor();
        if (descriptor.dimension !== TextureViewDimension.DIMENSION_2D) {
            throw new Error("Only 2D texture views are implemented for WebGPU.");
        }
        const view = WebGpuUtilities.textureView.create2D(
            this.gpuTexture, WebGpuConverter.convertTextureFormat(descriptor.textureFormat), descriptor.label);
        return new WebGpuTextureView(view, descriptor.textureFormat, descriptor.dimension);
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }
        WebGpuUtilities.texture.dispose(this._gpuTexture);
        this._gpuTexture = null;
        this._gpuDefaultView = null;
        this.defaultTextureView?.dispose();
        this._state = State.DISPOSED;

        for (const listener of this._disposedListeners.slice()) {
            listener(this);
        }
    }

    /** One default texture per framework. */
    private static readonly _defaultFilled = new WeakMap<IFramework, WebGpuTexture2D>();

    /**
     * Returns the framework's 1x1 white texture, creating it on first use.
     * Used when a pipeline has no texture set.
     * @param framework The framework.
     */
    public static getOrCreateDefault(framework: IFramework): WebGpuTexture2D {
        let texture = WebGpuTexture2D._defaultFilled.get(framework);
        if (!texture || texture.state === State.DISPOSED) {
            const desc: ITextureDescriptor = {
                width: 1,
                height: 1,
                data: [new Uint8Array([255, 255, 255, 255])],
                textureFormat: framework.renderer.preferredTextureFormat,
                textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
                label: "RisDefaultFilledTexture",
            };
            texture = new WebGpuTexture2D(framework, desc);
            texture.initialize();
            WebGpuTexture2D._defaultFilled.set(framework, texture);
        }
        return texture;
    }

    /**
     * Disposes and forgets the framework's default texture. Called from `Framework.dispose()`.
     * @param framework The framework.
     */
    public static disposeDefault(framework: IFramework): void {
        const texture = WebGpuTexture2D._defaultFilled.get(framework);
        WebGpuTexture2D._defaultFilled.delete(framework);
        texture?.dispose();
    }
}
