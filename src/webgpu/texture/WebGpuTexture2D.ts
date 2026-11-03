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
import { ATexture2D } from "../../core/rendering/texture/texture.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuConverter } from "../utilities/WebGpuConverter.ts";
import { WebGpuTextureView } from "./WebGpuTextureView.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";
import { vec2 } from "gl-matrix";

/**
 * The WebGPU 2D texture.
 *
 * Supports `Uint8Array` mip levels (uncompressed or compressed, e.g. from KTX2) or `HTMLImageElement` mip levels.
 * Mipmap generation is not implemented for WebGPU yet.
 * @internal
 */
export class WebGpuTexture2D extends ATexture2D {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
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

        if (!this._label) {
            this._label = `WebGpuTexture2D ${this.id}`;
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
        this._validateState();

        const isCompressed = TextureUtilities.isCompressedTextureFormat(this.textureFormat);

        if (this._generateMipMaps) {
            throw new Error("Not implemented!");
        }

        const device = this._graphicsDevice.device;
        const data = this._data;
        const hasImages = typeof HTMLImageElement !== "undefined" && !!data && data[0] instanceof HTMLImageElement;

        if (isCompressed) {
            if (hasImages) {
                throw new Error("WebGpuTexture2D: compressed formats need Uint8Array data, not images.");
            }

            // Compressed formats need a block-aligned base size (e.g. ASTC 10x5 at 768x512 -> 770x515).
            const result = WebGpuUtilities.texture.createCompressedTexture(
                device,
                this._baseSize,
                this._blockSize,
                this.textureFormat,
                this.textureUsage,
                data as Uint8Array[] | undefined,
                this._mipLevels,
                1,
                this.label);

            this._gpuTexture = result.texture;
            this._nativeSize = vec2.fromValues(result.size.width, result.size.height!);
        }
        else {
            this._gpuTexture = WebGpuUtilities.texture.create(
                device,
                this._baseSize,
                this.textureFormat,
                this.textureUsage,
                data,
                this._mipLevels, 1,
                this.label);
        }

        this._gpuDefaultView = WebGpuUtilities.textureView.create(this._gpuTexture, { label: `${this.label} default view` });
        // ATexture2D declares the default view readonly and sets it to null; fill it in here.
        (this as { defaultTextureView: ITextureView }).defaultTextureView =
            new WebGpuTextureView(this._gpuDefaultView, this.textureFormat);
        this._handle = this._gpuTexture;

        this._state = State.INITIALIZED;

        let width = this.nativeSize[0];
        let height = this.nativeSize[1];
        this._vramSize = 0;
        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height);
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
