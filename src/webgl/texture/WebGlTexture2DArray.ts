import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {
    type IFramework, State,
    type ITextureView2D,
    TextureUtilities,
    type ITextureDescriptor, TextureFormat,
} from "../../api";
import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {ATexture2DArray} from "../../api/rendering/texture/ATexture2DArray.ts";

/**
 * WebGL2 2D texture array (`TEXTURE_2D_ARRAY`, sampled as `sampler2DArray`).
 * Compressed formats are not implemented yet.
 *
 * WebGL2 does not support texture views ({@link IGraphicsDeviceFeatures.supportsTextureView} is false).
 * Use the texture directly (e.g. {@link glTexture}). Calling {@link getTextureView} throws.
 */
export class WebGlTexture2DArray extends ATexture2DArray {

    private readonly _graphicsDevice: WebGlGraphicsDevice;

    private _glTexture: WebGLTexture | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param textureDescriptor The texture descriptor.
     */
    constructor(
        framework: IFramework,
        textureDescriptor: ITextureDescriptor
    ) {
        const graphicsDevice = framework.renderer.graphicsDevice as WebGlGraphicsDevice;
        super(graphicsDevice, textureDescriptor);
        this._graphicsDevice = graphicsDevice;
        this.gl = this._graphicsDevice.gl!;
    }

    /**
     * The {@link WebGL2RenderingContext} of the framework's graphics device.
     * @internal
     */
    public readonly gl: WebGL2RenderingContext;

    /**
     * Gets the underlying WebGL texture (a `TEXTURE_2D_ARRAY`). Null-asserted; only valid after {@link initialize} and before {@link dispose}.
     * @returns The WebGL texture.
     */
    public get glTexture(): WebGLTexture {
        return this._glTexture!;
    }

    /** @inheritdoc */
    public initialize(): void {
       this._validateState();

        if (TextureUtilities.isCompressedTextureFormat(this.textureFormat)) {
            throw new Error(`WebGlTexture2DArray.initialize: compressed texture arrays (${this.textureFormat}) are not implemented for WebGL2 yet ('${this.label ?? this.id}').`);
            //this._glTexture = WebGlUtilities.texture.createCompressedTexture2D(
            //    this.gl, vec2.fromValues(this.size[0], this.size[1]),
            //    this._blockSize, this._data as Uint8Array[] | undefined, this.label, this.textureFormat, 0);
        } else {
            this._glTexture = WebGlUtilities.texture.createTexture2DArray(
                this.gl,
                this.size[0], this.size[1], this.size[2],
                this._data,
                this.textureFormat,
                this._generateMipMaps,
                0,
                this.label
            );
        }

        this._state = State.INITIALIZED;

        let width = this.size[0];
        let height = this.size[1];

        // If we can generate mipmaps, we need to calculate the number of mip levels.
        if(this._generateMipMaps) {
            this._mipLevels = TextureUtilities.mipLevels(width, height);
        }
        this._vramSize = 0;

        const layers = this.size[2];
        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height) * layers;
            // Each mip is at least 1x1 and has whole-pixel dimensions. Layer count stays the same.
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }
    }

    /**
     * WebGL2 does not support texture views. Always throws.
     * @inheritdoc
     */
    protected _createTextureView(_textureFormat: TextureFormat): ITextureView2D {
        throw new Error(
            `WebGL2 does not support texture views (graphicsDevice.features.supportsTextureView is false). ` +
            `Use the texture directly (WebGlTexture2DArray.glTexture).`
        );
    }


    /** @inheritdoc */
    public dispose(): void {

        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }

        this._disposeTextureViews();
        this.gl.deleteTexture(this._glTexture);
        this._glTexture = null;
        this._state = State.DISPOSED;

        // Iterate a copy. A listener may remove itself while this loop runs.
        for (const listener of this._disposedListeners.slice()) {
            listener(this);
        }
    }

    /** One default texture per framework, so a new framework (and GL context) never gets a texture of an old one. */
    private static readonly _defaultFilled = new WeakMap<IFramework, WebGlTexture2DArray>();

    /**
     * Creates a default 1x1, one-layer white texture array if it doesn't already exist and returns it.
     * This can be used as a placeholder when a texture array is expected but not available.
     * @param framework The framework instance.
     * The texture belongs to that framework's GL context; each framework gets its own.
     * @returns The default 1x1, one-layer white texture array.
     */
    public static getOrCreateDefault(framework: IFramework): WebGlTexture2DArray {
        let texture = WebGlTexture2DArray._defaultFilled.get(framework);
        if (!texture || texture.state === State.DISPOSED) {

            const desc: ITextureDescriptor = {
                width: 1,
                height: 1,
                dataArray: [[new Uint8Array([255, 255, 255, 255])]],
                textureFormat: framework.renderer.preferredTextureFormat,
                label: "RisDefaultFilledTextureArray",
            };

            texture = new WebGlTexture2DArray(framework, desc);
            texture.initialize();
            WebGlTexture2DArray._defaultFilled.set(framework, texture);
        }

        return texture;
    }

    /**
     * Disposes and forgets the default texture array of a framework. Called from `Framework.dispose()`.
     * @param framework The framework instance.
     */
    public static disposeDefault(framework: IFramework): void {
        const texture = WebGlTexture2DArray._defaultFilled.get(framework);
        WebGlTexture2DArray._defaultFilled.delete(framework);
        texture?.dispose();
    }

}
