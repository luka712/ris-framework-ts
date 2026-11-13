import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {
    type IFramework, State,
    type ITextureView2D,
    TextureUtilities,
    type ITextureDescriptor, TextureFormat,
} from "../../api";
import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {ATexture2D} from "../../api/rendering/texture/ATexture2D.ts";
import {vec2} from "gl-matrix";

/**
 * WebGL2 texture.
 *
 * WebGL2 does not support texture views ({@link IGraphicsDeviceFeatures.supportsTextureView} is false).
 * Use the texture directly (e.g. {@link glTexture} / render-pass `texture`). Calling {@link getTextureView} throws.
 */
export class WebGlTexture2D extends ATexture2D {

    private readonly _graphicsDevice: WebGlGraphicsDevice;

    private _glTexture: WebGLTexture | null = null;

    /**
     * The constructor.
     * @param framework The framework instance.
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
     * Gets the underlying WebGL texture (a `TEXTURE_2D`). Null-asserted; only valid after {@link initialize} and before {@link dispose}.
     * @returns The WebGL texture.
     */
    public get glTexture(): WebGLTexture {
        return this._glTexture!;
    }

    /** @inheritdoc */
    public initialize(): void {
        this._validateState();

        if (TextureUtilities.isCompressedTextureFormat(this.textureFormat)) {
            this._glTexture = WebGlUtilities.texture.createCompressedTexture2D(
                this.gl, vec2.fromValues(this.size[0], this.size[1]),
                this._blockSize, this._data as Uint8Array[] | undefined, this.label, this.textureFormat, 0);
        } else {
            this._glTexture = WebGlUtilities.texture.createTexture2D(
                this.gl,
                this.size[0], this.size[1],
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

        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height);
            // Each mip is at least 1x1 and has whole-pixel dimensions.
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
            `Use the texture directly (RenderPassColorAttachment.texture / WebGlTexture2D.glTexture).`
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
