import {
    type IFramework,
    State,
    TextureUsage,
    TextureUtilities,
    TextureViewDimension,
    type ITextureView2D,
    type ITextureDescriptor,
    type TextureFormat,
} from "../../api/index.ts";
import {ATexture2DArray} from "../../api/rendering/texture/ATexture2DArray.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";
import {WebGpuTextureView} from "./WebGpuTextureView.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU 2D texture array: a `GPUTexture` with `dimension: "2d"` and `depthOrArrayLayers` set to the layer count,
 * sampled in WGSL as `texture_2d_array<f32>` through a `2d-array` view.
 *
 * Every layer and mip level of {@link ITextureDescriptor.dataArray} is uploaded with `GPUQueue.writeTexture`
 * (`origin.z` is the layer). Supports `Uint8Array` mip levels (uncompressed, or block-compressed e.g. from KTX2)
 * and `HTMLImageElement` mip levels (uncompressed only; needs `COPY_DST` and `RENDER_ATTACHMENT` usage).
 * Mipmap generation is not implemented for WebGPU yet.
 * @internal
 */
export class WebGpuTexture2DArray extends ATexture2DArray {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _gpuTexture: GPUTexture | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The texture descriptor. `layers` (or `dataArray.length`) is the layer count.
     * By default, usage is `TEXTURE_BINDING | COPY_DST` and the label is `WebGpuTexture2DArray <id>`.
     */
    public constructor(framework: IFramework, descriptor: ITextureDescriptor) {
        const graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        super(graphicsDevice, descriptor);
        this._graphicsDevice = graphicsDevice;

        if (!this._label) {
            this._label = `WebGpuTexture2DArray ${this.id}`;
        }
    }

    /** The WebGPU texture. Throws when the texture is not initialized or is disposed. */
    public get gpuTexture(): GPUTexture {
        if (!this._gpuTexture) {
            throw new Error(`WebGpuTexture2DArray.gpuTexture: '${this.label ?? this.id}' is not initialized or is disposed.`);
        }
        return this._gpuTexture;
    }

    /**
     * The default WebGPU `2d-array` view of every layer and mip level, in the texture's own format.
     * Same as `defaultTextureView.nativeObject`. Throws when the texture is not initialized or is disposed.
     */
    public get gpuDefaultView(): GPUTextureView {
        if (!this._gpuTexture) {
            throw new Error(`WebGpuTexture2DArray.gpuDefaultView: '${this.label ?? this.id}' is not initialized or is disposed.`);
        }
        return (this.defaultTextureView as WebGpuTextureView).gpuTextureView;
    }

    /**
     * Creates the GPU texture and uploads every layer and mip level.
     * @throws Error when the texture is already initialized or disposed, mipmap generation is requested,
     * the usage lacks `COPY_DST` (or `RENDER_ATTACHMENT` for images) while there is data to upload,
     * or a compressed format is given images.
     */
    public initialize(): void {
        this._validateState();

        const name = this.label ?? this.id;
        if (this._generateMipMaps) {
            throw new Error(`WebGpuTexture2DArray.initialize: mipmap generation (generateMipmaps) is not implemented for WebGPU yet ('${name}'). Provide the mip levels per layer in ITextureDescriptor.dataArray instead.`);
        }

        const data = this._data;
        const hasData = !!data && data.some(levels => !!levels && levels.length > 0);
        const hasImages = hasData && typeof HTMLImageElement !== "undefined"
            && data!.some(levels => !!levels && levels[0] instanceof HTMLImageElement);

        if (hasData && (this.textureUsage & TextureUsage.COPY_DST) == 0) {
            throw new Error(`WebGpuTexture2DArray.initialize: '${name}' has data to upload, but its usage (${WebGpuTexture2DArray._usageNames(this.textureUsage)}) has no TextureUsage.COPY_DST. Add COPY_DST to ITextureDescriptor.textureUsage.`);
        }
        if (hasImages && TextureUtilities.isCompressedTextureFormat(this.textureFormat)) {
            throw new Error(`WebGpuTexture2DArray.initialize: compressed format ${this.textureFormat} needs Uint8Array data, not images ('${name}').`);
        }
        if (hasImages && (this.textureUsage & TextureUsage.RENDER_ATTACHMENT) == 0) {
            throw new Error(`WebGpuTexture2DArray.initialize: '${name}' uploads images with copyExternalImageToTexture, which needs TextureUsage.RENDER_ATTACHMENT, but its usage is ${WebGpuTexture2DArray._usageNames(this.textureUsage)}. Add RENDER_ATTACHMENT to ITextureDescriptor.textureUsage.`);
        }

        const result = TextureUtilities.isCompressedTextureFormat(this.textureFormat)
            ? WebGpuUtilities.texture.create2DArrayCompressed(
                this._graphicsDevice.device,
                this._baseSize,
                this.size[2],
                this._blockSize,
                this.textureFormat,
                this.textureUsage,
                data as Uint8Array[][] | undefined,
                this.label,
                this.viewFormats)
            : WebGpuUtilities.texture.create2DArray(
                this._graphicsDevice.device,
                this._baseSize,
                this.size[2],
                this.textureFormat,
                this.textureUsage,
                data,
                this.label,
                this.viewFormats);

        this._gpuTexture = result.texture;
        this._handle = this._gpuTexture;
        this._state = State.INITIALIZED;

        let width = this.size[0];
        let height = this.size[1];
        const layers = this.size[2];
        this._vramSize = 0;
        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height) * layers;
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }
    }

    /**
     * Creates a native `2d-array` view of every layer and mip level with `GPUTexture.createView`.
     * The format is legal because the texture was created with `GPUTextureDescriptor.viewFormats` set to {@link viewFormats}.
     * @inheritDoc
     */
    protected _createTextureView(textureFormat: TextureFormat): ITextureView2D {
        const label = textureFormat == this.textureFormat ? `${this.label} default view` : `${this.label} ${textureFormat} view`;
        const view = WebGpuUtilities.textureView.create2DArray(
            this.gpuTexture, WebGpuConverter.convertTextureFormat(textureFormat), label);
        return new WebGpuTextureView(view, textureFormat, TextureViewDimension.DIMENSION2DARRAY, label);
    }

    /** Destroys the GPU texture and its views, then raises the disposed listeners. Does nothing when already disposed. */
    public dispose(): void {
        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }
        this._disposeTextureViews();
        WebGpuUtilities.texture.dispose(this._gpuTexture);
        this._gpuTexture = null;
        this._state = State.DISPOSED;

        // Iterate a copy. A listener may remove itself while this loop runs.
        for (const listener of this._disposedListeners.slice()) {
            listener(this);
        }
    }

    /**
     * Formats texture usage flags for error messages, e.g. `TEXTURE_BINDING | COPY_DST`.
     * @param usage The usage flags.
     * @returns The flag names joined with ` | `, or `NONE`.
     */
    private static _usageNames(usage: TextureUsage): string {
        const flags = [TextureUsage.COPY_SRC, TextureUsage.COPY_DST, TextureUsage.TEXTURE_BINDING, TextureUsage.STORAGE_BINDING, TextureUsage.RENDER_ATTACHMENT];
        const names = flags.filter(flag => (usage & flag) != 0).map(flag => TextureUsage[flag]);
        return names.length > 0 ? names.join(" | ") : "NONE";
    }

    /** One default texture array per framework. */
    private static readonly _defaultFilled = new WeakMap<IFramework, WebGpuTexture2DArray>();

    /**
     * Returns the framework's 1x1, one-layer white texture array, creating it on first use.
     * Used when a pipeline has no texture array set.
     * @param framework The framework.
     * @returns The default texture array.
     */
    public static getOrCreateDefault(framework: IFramework): WebGpuTexture2DArray {
        let texture = WebGpuTexture2DArray._defaultFilled.get(framework);
        if (!texture || texture.state === State.DISPOSED) {
            const desc: ITextureDescriptor = {
                width: 1,
                height: 1,
                layers: 1,
                dataArray: [[new Uint8Array([255, 255, 255, 255])]],
                textureFormat: framework.renderer.preferredTextureFormat,
                textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
                label: "RisDefaultFilledTextureArray",
            };
            texture = new WebGpuTexture2DArray(framework, desc);
            texture.initialize();
            WebGpuTexture2DArray._defaultFilled.set(framework, texture);
        }
        return texture;
    }

    /**
     * Disposes and forgets the framework's default texture array. Called from `Framework.dispose()`.
     * @param framework The framework.
     */
    public static disposeDefault(framework: IFramework): void {
        const texture = WebGpuTexture2DArray._defaultFilled.get(framework);
        WebGpuTexture2DArray._defaultFilled.delete(framework);
        texture?.dispose();
    }
}
