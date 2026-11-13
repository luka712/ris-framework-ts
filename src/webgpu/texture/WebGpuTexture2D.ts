import {
    type IFramework,
    State,
    TextureUtilities,
    type ITextureView2D,
    type ITextureDescriptor,
    type TextureFormat,
} from "../../api/index.ts";
import { ATexture2D } from "../../api/rendering/texture/ATexture2D.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuConverter } from "../utilities/WebGpuConverter.ts";
import { WebGpuTextureView } from "./WebGpuTextureView.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";

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

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The texture descriptor.
     */
    public constructor(framework: IFramework, descriptor: ITextureDescriptor) {
        const graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        super(graphicsDevice, descriptor);
        this._graphicsDevice = graphicsDevice;

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

    /** The default WebGPU view of the whole texture, in the texture's own format. Same as `defaultTextureView.nativeObject`. */
    public get gpuDefaultView(): GPUTextureView {
        if (!this._gpuTexture) {
            throw new Error("WebGpuTexture2D: the texture is not initialized or is disposed.");
        }
        return (this.defaultTextureView as WebGpuTextureView).gpuTextureView;
    }

    /** @inheritDoc */
    public initialize(): void {
        this._validateState();

        const isCompressed = TextureUtilities.isCompressedTextureFormat(this.textureFormat);

        if (this._generateMipMaps) {
            throw new Error(`WebGpuTexture2D.initialize: mipmap generation (generateMipmaps) is not implemented for WebGPU yet ('${this.label ?? this.id}'). Provide the mip levels in ITextureDescriptor.data instead.`);
        }

        const device = this._graphicsDevice.device;
        const data = this._data;
        const hasImages = typeof HTMLImageElement !== "undefined" && !!data && data[0] instanceof HTMLImageElement;

        if (isCompressed) {
            if (hasImages) {
                throw new Error(`WebGpuTexture2D.initialize: compressed format ${this.textureFormat} needs Uint8Array data, not images ('${this.label ?? this.id}').`);
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
                this.label,
                this.viewFormats);

            this._gpuTexture = result.texture;
        }
        else {
            this._gpuTexture = WebGpuUtilities.texture.create(
                device,
                this._baseSize,
                this.textureFormat,
                this.textureUsage,
                data,
                this._mipLevels, 1,
                this.label,
                this.viewFormats);
        }

        this._handle = this._gpuTexture;

        this._state = State.INITIALIZED;

        let width = this.size[0];
        let height = this.size[1];
        this._vramSize = 0;
        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height);
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }
    }

    /**
     * Creates a native 2D view with `GPUTexture.createView`. The format is legal because the texture was created
     * with `GPUTextureDescriptor.viewFormats` set to {@link viewFormats} (e.g. RGBA8_UNORM with an RGBA8_UNORM_SRGB view).
     * @inheritDoc
     */
    protected _createTextureView(textureFormat: TextureFormat): ITextureView2D {
        const label = textureFormat == this.textureFormat ? `${this.label} default view` : `${this.label} ${textureFormat} view`;
        const view = WebGpuUtilities.textureView.create2D(
            this.gpuTexture, WebGpuConverter.convertTextureFormat(textureFormat), label);
        return new WebGpuTextureView(view, textureFormat, undefined, label);
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }
        this._disposeTextureViews();
        WebGpuUtilities.texture.dispose(this._gpuTexture);
        this._gpuTexture = null;
        this._state = State.DISPOSED;

        for (const listener of this._disposedListeners.slice()) {
            listener(this);
        }
    }
}
