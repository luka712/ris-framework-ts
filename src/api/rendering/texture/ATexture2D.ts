import {
    type IGraphicsDevice,
    type ITexture2D, type ITextureDescriptor, type ITextureView2D,
    State,
    type TextureFormat,
    TextureUsage,
} from "../../index.ts";
import { vec2 } from "gl-matrix";

/**
 * Abstract base for {@link ITexture2D}. Holds size, format, usage, view-format list and a per-format view cache.
 * Backends that support views (WebGPU: `supportsTextureView`) create them in {@link _createTextureView};
 * WebGL2 rejects `viewFormats` in the constructor and throws from {@link _createTextureView} / {@link getTextureView}.
 */
export abstract class ATexture2D implements ITexture2D {

    private static _nextId: number = 1;

    /**
     * The created texture views, cached by view format. Views are created on first request by {@link getTextureView}.
     * @protected
     */
    protected readonly _textureViews: Map<TextureFormat, ITextureView2D> = new Map();

    /** The base (mip 0) size [width, height] in pixels. Returned by {@link size}. */
    protected _baseSize: vec2;
    /** The native texture handle (backend specific). Returned by {@link handle}. */
    protected _handle: any;
    /** The lifecycle state. Defaults to {@link State.CREATED}. */
    protected _state: State = State.CREATED;
    /** The approximate VRAM size in bytes. Set by the backend in {@link initialize}. Defaults to `0`. */
    protected _vramSize = 0;
    /** Whether the backend generates mipmaps. Only true when requested and no mip levels are provided. Defaults to `false`. */
    protected _generateMipMaps: boolean = false;
    /** The number of mip levels: the length of {@link _data}, or `1` without data. Backends update it when mipmaps are generated. */
    protected _mipLevels: number;
    /** The data per mip level, from {@link ITextureDescriptor.data}. */
    protected _data?: Uint8Array[] | HTMLImageElement[];
    /** The block size of a compressed format, from {@link ITextureDescriptor.blockSize}. Defaults to `[1, 1]`. */
    protected _blockSize: vec2;
    /** The label, from {@link ITextureDescriptor.label}. */
    protected _label?: string;

    /** The listeners raised by {@link dispose}. */
    protected _disposedListeners: ((tex: ITexture2D) => void)[] = [];

    /**
     * The constructor.
     * @param graphicsDevice The graphics device. Used to reject `viewFormats` when {@link IGraphicsDeviceFeatures.supportsTextureView} is false.
     * @param descriptor The texture descriptor. `textureFormat`, `width` and `height` are required; `width` and `height` must be greater than `0`.
     * @throws Error when `viewFormats` are given on a device without texture views, or when the format or size is missing.
     */
    protected constructor(
        graphicsDevice: IGraphicsDevice,
        descriptor: ITextureDescriptor,
    ) {

        // Extra view formats need native texture views (WebGPU). WebGL2 has supportsTextureView === false.
        if (descriptor.viewFormats && descriptor.viewFormats.length > 0 && !graphicsDevice.features.supportsTextureView) {
            throw new Error(
                `Texture view formats are not supported by ${graphicsDevice.api} ` +
                `(graphicsDevice.features.supportsTextureView is false). Omit ITextureDescriptor.viewFormats and use the texture directly.`
            );
        }

        if (!descriptor.textureFormat) {
            throw new Error(`ATexture2D: '${descriptor.label ?? "unlabeled"}' has no textureFormat. Set ITextureDescriptor.textureFormat.`);
        }

        if (!descriptor.width || !descriptor.height || descriptor.width <= 0 || descriptor.height <= 0) {
            throw new Error(`ATexture2D: '${descriptor.label ?? "unlabeled"}' has size ${descriptor.width}x${descriptor.height}; width and height must be greater than 0.`);
        }

        this.id = ATexture2D._generateId();
        this.textureFormat = descriptor.textureFormat;
        this.textureUsage = descriptor.textureUsage ?? (TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST);
        this._baseSize = vec2.fromValues(descriptor.width ?? 0, descriptor.height ?? 0);
        this._data = descriptor.data;
        this._mipLevels = this._data?.length ?? 1;
        this._generateMipMaps = (descriptor.generateMipmaps ?? false) && this._mipLevels <= 1;
        this._label = descriptor.label;
        this._blockSize = descriptor.blockSize ?? vec2.fromValues(1, 1);

        // TEXTURE VIEW. The texture's own format is always a valid view format.
        this.viewFormats = [this.textureFormat];
        if(descriptor.viewFormats) {
            for(const viewFormat of descriptor.viewFormats) {
                if(!this.viewFormats.includes(viewFormat)) {
                    this.viewFormats.push(viewFormat);
                }
            }
        }
        // Views need the native texture, so they are created lazily (after initialize) by getTextureView.
    }

    /** @inheritDoc */
    public addOnDisposedListener(event: (sender: ITexture2D) => void): void {
        this._disposedListeners.push(event);
    }

    /** @inheritDoc */
    public removeOnDisposedListener(event: (sender: ITexture2D) => void): void {

        const index = this._disposedListeners.indexOf(event);
        if (index > -1) {
            // splice removes in place. Its return value is the removed listener, not the remaining list.
            this._disposedListeners.splice(index, 1);
        }
    }

    /** @inheritDoc */
    public readonly id: number;

    /** @inheritDoc */
    public get defaultTextureView(): ITextureView2D {
        return this.getTextureView(this.textureFormat);
    }

    /** @inheritDoc */
    public readonly textureUsage: TextureUsage;

    /** @inheritDoc */
    public readonly viewFormats: TextureFormat[];

    /** @inheritDoc */
    public readonly textureFormat: TextureFormat;

    /** @inheritDoc */
    public get textureState(): State {
        return this._state;
    }

    /** @inheritDoc */
    public get handle(): any {
        return this._handle;
    }

    /**
     * Generates a unique ID for each texture instance.
     * @returns A unique ID for the texture instance.
     */
    private static _generateId(): number {
        return ATexture2D._nextId++;
    }

    /**
     * Checks that the texture can still be initialized. Backends call this at the start of {@link initialize}.
     * @throws Error when the texture is already initialized or disposed.
     */
    protected _validateState(): void {

        if (this._state == State.INITIALIZED) {
            throw new Error(`Texture '${this.label ?? this.id}' is already initialized.`);
        } else if (this._state == State.DISPOSED) {
            throw new Error(`Texture '${this.label ?? this.id}' is already disposed.`);
        }
    }

    /** @inheritDoc */
    abstract initialize(): void;

    /** The current state. Same as {@link textureState}. */
    public get state(): State {
        return this._state;
    }

    /** @inheritdoc */
    public get size(): vec2 {
        return this._baseSize;
    }

    /** @inheritDoc */
    public get vramSize(): number {
        return this._vramSize;
    }

    /** @inheritDoc */
    public get mipLevels(): number {
        return this._mipLevels;
    }

    /** @inheritdoc */
    public get label(): string | undefined {
        return this._label;
    }


    /** @inheritDoc */
    public getTextureView(textureFormat: TextureFormat): ITextureView2D {

        if (!this.viewFormats.includes(textureFormat)) {
            throw new Error(`Texture '${this.label ?? this.id}': view format ${textureFormat} is not in viewFormats [${this.viewFormats.join(", ")}]. ` +
                `Add it to ITextureDescriptor.viewFormats when creating the texture.`);
        }

        if (this._state != State.INITIALIZED) {
            throw new Error(`Texture '${this.label ?? this.id}': a texture view can only be created for an initialized texture.`);
        }

        let view = this._textureViews.get(textureFormat);
        if (!view) {
            view = this._createTextureView(textureFormat);
            this._textureViews.set(textureFormat, view);
        }
        return view;
    }

    /**
     * Creates a native texture view. Called once per view format by {@link getTextureView}, which caches the result.
     * @param textureFormat The view format. Always one of {@link viewFormats}.
     * @returns The new texture view.
     * @protected
     */
    protected abstract _createTextureView(textureFormat: TextureFormat): ITextureView2D;

    /**
     * Disposes all created texture views and clears the cache. Backends call this from dispose(), before releasing the native texture.
     * @protected
     */
    protected _disposeTextureViews(): void {
        for (const view of this._textureViews.values()) {
            view.dispose();
        }
        this._textureViews.clear();
    }

    /** @inheritDoc */
    public abstract dispose(): void;
}
