import {
    type ITexture2D, type ITextureView,
    State,
    type TextureDescriptor,
    type TextureFormat,
    TextureUsage,
    TextureViewDescriptor
} from "ris-framework-api";
import {vec2} from "gl-matrix";

/**
 * The ATexture2D class is an abstract base class that implements the ITexture2D interface. It provides common properties and a constructor for initializing a 2D texture, but it does not implement the actual texture creation and management logic, which must be provided by subclasses that extend this base class.
 */
export abstract class ATexture2D implements ITexture2D {

    private static _nextId: number = 1;

    protected _handle: any;
    protected _state: State = State.CREATED;
    protected _size = 0;
    protected _generateMipMaps: boolean = false;
    protected _mipLevels: number;
    protected _data?: Uint8Array[];
    protected _blockSize: vec2;

    protected _disposedListeners: ((tex: ITexture2D) => void)[] = [];

    /**
     * The constructor for the ATexture2D class.
     * @param descriptor - The texture descriptor.
     */
    protected constructor(
        descriptor: TextureDescriptor,
    ) {

        if (!descriptor.textureFormat) {
            throw new Error("Texture format is required.");
        }

        this.id = ATexture2D.generateId();
        this.textureFormat = descriptor.textureFormat;
        this.textureUsage = descriptor.textureUsage;
        this.textureViewFormat = descriptor.textureFormat;
        this.width = descriptor.width;
        this.height = descriptor.height;
        this._data = descriptor.data;
        this._mipLevels = this._data?.length ?? 1;
        this._generateMipMaps = descriptor.generateMipmaps && this._mipLevels <= 1;
        this.label = descriptor.label;
        this._blockSize = descriptor.blockSize ?? vec2.fromValues(1, 1);

        if (this.width == 0 || this.height == 0) {
            throw new Error("Width or height cannot be zero.");
        }

        // @ts-ignore
        this.defaultTextureView = null;

    }

    /** @inheritDoc */
    public addOnDisposedListener(event: (sender: ITexture2D) => void): void {
        this._disposedListeners.push(event);
    }

    /** @inheritDoc */
    public removeOnDisposedListener(event: (sender: ITexture2D) => void): void {

        let index = this._disposedListeners.indexOf(event);
        if (index > -1) {
            this._disposedListeners = this._disposedListeners.splice(index, 1);
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
    private static generateId(): number {
        return ATexture2D._nextId++;
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
    public readonly width: number;

    /** @inheritdoc */
    public readonly height: number;

    /** @inheritDoc */
    public get size(): number {
        return this._size;
    }

    /** @inheritDoc */
    public get mipLevels(): number {
        return this._mipLevels;
    }

    /** @inheritdoc */
    public readonly label: string | null;

    /**
     * Creates a texture view for the texture.
     * @param descriptor The descriptor for the texture view.
     * @returns The created texture view, which can be used for sampling the texture in shaders.
     */
    public abstract createView(descriptor?: TextureViewDescriptor): ITextureView;

    /** @inheritDoc */
    public abstract dispose(): void;
}
