import {
    type IFramework,
    State,
    TextureUsage,
    TextureUtilities,
    type ITextureView,
    TextureViewDescriptor,
    TextureViewDimension,
} from "../../api/index.ts";
import {ATexture2D} from "../../core/rendering/texture/texture.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {GpuTextureUsage, type GpuTexture, type GpuTextureView} from "../WebGpuTypes.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";
import {WebGpuTextureView} from "./WebGpuTextureView.ts";
import {type ResolvedTextureDescriptor, resolveTextureDescriptor} from "../../core/rendering/texture/TextureDescriptorUtilities.ts";

/**
 * The WebGPU 2D texture.
 *
 * Supports uncompressed formats with `Uint8Array` mip levels or an `HTMLImageElement`.
 * Mipmap generation and compressed (KTX2) formats are not implemented for WebGPU yet.
 * @internal
 */
export class WebGpuTexture2D extends ATexture2D {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _image?: HTMLImageElement;
    private _gpuTexture: GpuTexture | null = null;
    private _gpuDefaultView: GpuTextureView | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The texture descriptor.
     * @param image An optional image to upload instead of `descriptor.data`.
     */
    public constructor(framework: IFramework, descriptor: ResolvedTextureDescriptor, image?: HTMLImageElement) {
        super(descriptor);
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        this._image = image;
    }

    /** The WebGPU texture. */
    public get gpuTexture(): GpuTexture {
        if (!this._gpuTexture) {
            throw new Error("WebGpuTexture2D: the texture is not initialized or is disposed.");
        }
        return this._gpuTexture;
    }

    /** The default WebGPU view of the whole texture. */
    public get gpuDefaultView(): GpuTextureView {
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

        if (TextureUtilities.isCompressedTextureFormat(this.textureFormat)) {
            throw new Error("Compressed textures are not implemented for WebGPU.");
        }
        if (this._generateMipMaps) {
            console.warn("WebGpuTexture2D: mipmap generation is not implemented for WebGPU; only the base level is used.");
            this._generateMipMaps = false;
        }

        const hasData = !!this._data && this._data.length > 0;
        let usage = WebGpuConverter.convertTextureUsage(this.textureUsage);
        // Uploading needs COPY_DST; copyExternalImageToTexture also needs RENDER_ATTACHMENT.
        if (hasData || this._image) {
            usage |= GpuTextureUsage.COPY_DST;
        }
        if (this._image) {
            usage |= GpuTextureUsage.RENDER_ATTACHMENT;
        }

        const device = this._graphicsDevice.device;
        this._gpuTexture = device.createTexture({
            label: this.label ?? `WebGpuTexture2D ${this.id}`,
            size: {width: this.width, height: this.height, depthOrArrayLayers: 1},
            mipLevelCount: this._mipLevels,
            format: WebGpuConverter.convertTextureFormat(this.textureFormat),
            usage,
        });

        if (this._image) {
            device.queue.copyExternalImageToTexture(
                {source: this._image},
                {texture: this._gpuTexture},
                {width: this.width, height: this.height});
        } else if (hasData) {
            let width = this.width;
            let height = this.height;
            for (let level = 0; level < this._data!.length; level++) {
                const levelData = this._data![level];
                const bytesPerPixel = TextureUtilities.getVRamSize(this.textureFormat, 1, 1);
                device.queue.writeTexture(
                    {texture: this._gpuTexture, mipLevel: level},
                    levelData,
                    {bytesPerRow: width * bytesPerPixel, rowsPerImage: height},
                    {width, height});
                width = Math.max(1, Math.floor(width / 2));
                height = Math.max(1, Math.floor(height / 2));
            }
        }

        this._gpuDefaultView = this._gpuTexture.createView({label: `${this.label ?? "WebGpuTexture2D"} default view`});
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
        const view = this.gpuTexture.createView({
            label: descriptor.label,
            format: WebGpuConverter.convertTextureFormat(descriptor.textureFormat),
            dimension: "2d",
        });
        return new WebGpuTextureView(view, descriptor.textureFormat, descriptor.dimension);
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }
        this._gpuTexture?.destroy();
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
            const desc = resolveTextureDescriptor({
                width: 1,
                height: 1,
                data: [new Uint8Array([255, 255, 255, 255])],
                textureFormat: framework.renderer.preferredTextureFormat,
                textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
                label: "RisDefaultFilledTexture",
            });
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
