import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {
    TextureDescriptor,
    type IFramework, State,
    type ITextureView,
    type TextureViewDescriptor, TextureUtilities
} from "ris-framework-api";
import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {ATexture2D} from "../../core/rendering/texture/texture.ts";
import {vec2} from "gl-matrix";

/**
 * The WebGL implementation of ITexture2D.
 */
export class WebGlTexture2D extends ATexture2D {

    private readonly _graphicsDevice: WebGlGraphicsDevice;
    private readonly _gl: WebGL2RenderingContext;
    private _glTexture: WebGLTexture | null = null;

    /**
     * The constructor.
     * @param _framework The framework instance.
     * @param textureDescriptor The texture descriptor.
     */
    constructor(
        private readonly _framework: IFramework,
        textureDescriptor: TextureDescriptor
    ) {
        super(textureDescriptor);
        this._graphicsDevice = this._framework.renderer.graphicsDevice as WebGlGraphicsDevice;
        this._gl = this._graphicsDevice.gl!;
    }

    /**
     * Gets the underlying WebGL texture.
     * @returns The WebGL texture.
     */
    public get glTexture(): WebGLTexture {
        return this._glTexture!;
    }

    /** @inheritdoc */
    public initialize(): void {
        if (this._state == State.INITIALIZED) {
            throw new Error("Texture is already initialized.");
        } else if (this._state == State.DISPOSED) {
            throw new Error("Texture is already disposed.");
        }

        if (TextureUtilities.isCompressedTextureFormat(this.textureFormat)) {
            this._glTexture = WebGlUtilities.texture.createCompressedTexture2D(
                this._gl, vec2.fromValues(this.width, this.height),
                this._blockSize, this._data, this.label, this.textureFormat, 0);
        } else {
            this._glTexture = WebGlUtilities.texture.createTexture2D(
                this._gl,
                this.width, this.height,
                this._data,
                this.textureFormat,
                this._generateMipMaps,
                0,
                this.label
            );
        }

        this._state = State.INITIALIZED;


        let width = this.width;
        let height = this.height;

        // If we can generate mipmaps, we need to calculate the number of mip levels.
        if(this._generateMipMaps) {
            this._mipLevels = TextureUtilities.mipLevels(width, height);
        }
        this._size = 0;

        for (let i = 0; i < this.mipLevels; i++) {
            this._size += TextureUtilities.getVRamSize(this.textureFormat, width, height);
            width /= 2;
            height /= 2;
        }
    }

    /** @inheritdoc */
    public createView(_descriptor?: TextureViewDescriptor): ITextureView {
        throw new Error("Method not implemented.");
    }


    /** @inheritdoc */
    public dispose(): void {

        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }

        this._gl.deleteTexture(this._glTexture);
        this._glTexture = null;
        this._state = State.DISPOSED;

        for (const listener of this._disposedListeners) {
            listener(this);
        }
    }

    private static _defaultFilled: WebGlTexture2D | null = null;

    /**
     * Creates a default 1x1 white texture if it doesn't already exist and returns it.
     * This can be used as a placeholder texture when a texture is expected but not available.
     * @param framework The framework instance.
     * @returns The default 1x1 white texture.
     */
    public static getOrCreateDefault(framework: IFramework): WebGlTexture2D {
        if (this._defaultFilled === null || this._defaultFilled.state === State.DISPOSED) {

            const desc = new TextureDescriptor();
            desc.width = 1;
            desc.height = 1;
            desc.data = [new Uint8Array([255, 255, 255, 255])];
            desc.textureFormat = framework.renderer.preferredTextureFormat;
            desc.label = "RisDefaultFilledTexture";

            this._defaultFilled = new WebGlTexture2D(framework, desc);
            this._defaultFilled.initialize();
        }

        return this._defaultFilled;
    }

}