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
 * Block-compressed BC (S3TC, BPTC), ETC2 and ASTC formats are uploaded as they are when the device supports them;
 * PVRTC throws, as WebGL only allows it on `TEXTURE_2D`. Mipmaps can only be generated for RGBA8_UNORM and RGBA8_UNORM_SRGB.
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

    /**
     * Creates the WebGL texture and uploads every layer and mip level, then generates mipmaps when requested.
     * @throws Error when the texture is already initialized or disposed, a compressed format is not supported by the device,
     * is PVRTC or is given images, or mipmap generation is requested for a format other than RGBA8_UNORM or RGBA8_UNORM_SRGB.
     */
    public initialize(): void {
        this._validateState();

        if (TextureUtilities.isCompressedTextureFormat(this.textureFormat)) {
            if (!this._graphicsDevice.features.supportsTextureFormat(this.textureFormat)) {
                throw new Error(`WebGlTexture2DArray.initialize: '${this.label ?? this.id}' has compressed format ${this.textureFormat}, ` +
                    `which this WebGL2 device does not support (see graphicsDevice.features.supportedTextureFormats).`);
            }
            if (this._data && this._data.some(levels => levels?.some(level => !(level instanceof Uint8Array)))) {
                throw new Error(`WebGlTexture2DArray.initialize: compressed format ${this.textureFormat} needs Uint8Array data, not images ('${this.label ?? this.id}').`);
            }
            this._glTexture = WebGlUtilities.texture.createCompressedTexture2DArray(
                this.gl,
                this.size[0], this.size[1], this.size[2],
                this._blockSize,
                (this._data as Uint8Array[][] | undefined) ?? null,
                this.textureFormat,
                this.label ?? null);
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
}
