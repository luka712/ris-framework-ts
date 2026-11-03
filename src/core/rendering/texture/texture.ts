import {
    type ITexture2D, type ITextureDescriptor, type ITextureView,
    State,
    type TextureFormat,
    TextureUsage,
    TextureViewDescriptor
} from "../../../api/index.ts";
import { vec2 } from "gl-matrix";

/**
 * The ATexture2D class is an abstract base class that implements the ITexture2D interface. It provides common properties and a constructor for initializing a 2D texture, but it does not implement the actual texture creation and management logic, which must be provided by subclasses that extend this base class.
 */
export abstract class ATexture2D implements ITexture2D {

    private static _nextId: number = 1;

    protected _baseSize: vec2;
    protected _nativeSize: vec2;
    protected _handle: any;
    protected _state: State = State.CREATED;
    protected _vramSize = 0;
    protected _generateMipMaps: boolean = false;
    protected _mipLevels: number;
    protected _data?: Uint8Array[] | HTMLImageElement[];
    protected _blockSize: vec2;
    protected _label?: string;

    protected _disposedListeners: ((tex: ITexture2D) => void)[] = [];

    /**
     * The constructor for the ATexture2D class.
     * @param descriptor - The texture descriptor.
     */
    protected constructor(
        descriptor: ITextureDescriptor,
    ) {

        if (!descriptor.textureFormat) {
            throw new Error("Texture format is required.");
        }

        if (!descriptor.width || !descriptor.height || descriptor.width <= 0 || descriptor.height <= 0) {
            throw new Error("Width or height cannot be undefined or zero.");
        }

        this.id = ATexture2D._generateId();
        this.textureFormat = descriptor.textureFormat;
        this.textureUsage = descriptor.textureUsage ?? (TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST);
        this.textureViewFormat = descriptor.textureFormat;
        this._baseSize = vec2.fromValues(descriptor.width ?? 0, descriptor.height ?? 0);
        // By default, the GPU allocation matches the logical size. Backends that pad (e.g. WebGPU compressed) override it.
        this._nativeSize = vec2.clone(this._baseSize);
        this._data = descriptor.data;
        this._mipLevels = this._data?.length ?? 1;
        this._generateMipMaps = (descriptor.generateMipmaps ?? false) && this._mipLevels <= 1;
        this._label = descriptor.label;
        this._blockSize = descriptor.blockSize ?? vec2.fromValues(1, 1);

        // @ts-ignore
        this.defaultTextureView = null;

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
    public readonly defaultTextureView: ITextureView;

    /** @inheritDoc */
    public readonly textureUsage: TextureUsage;

    /** @inheritDoc */
    public readonly textureViewFormat: TextureFormat;

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

    /** Validate state of this texture. */
    protected _validateState(): void {

        if (this._state == State.INITIALIZED) {
            throw new Error("Texture is already initialized.");
        } else if (this._state == State.DISPOSED) {
            throw new Error("Texture is already disposed.");
        }
    }

    /**
     * Initializes the texture.
     */
    abstract initialize(): void;

    /** @inheritdoc */
    public get state(): State {
        return this._state;
    }

    /** @inheritdoc */
    public get size(): vec2 {
        return this._baseSize;
    }

    /** @inheritdoc */
    public get nativeSize(): vec2 {
        return this._nativeSize;
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
    public get label(): string | undefined {
        return this._label;
    }

    /**
     * Creates a texture view for the texture.
     * @param descriptor The descriptor for the texture view.
     * @returns The created texture view, which can be used for sampling the texture in shaders.
     */
    public abstract createView(descriptor?: TextureViewDescriptor): ITextureView;

    /** @inheritDoc */
    public abstract dispose(): void;
}
