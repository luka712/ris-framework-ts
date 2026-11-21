import {vec2} from "gl-matrix";
import {type IGraphicsDevice, type ISwapChain, TextureFormat} from "../../api";

/**
 * A WebGL swap chain.
 */
export class WebGlSwapChain implements ISwapChain {

    private readonly _canvas: HTMLCanvasElement

    private _backBufferSize: vec2;

    /**
     * The WebGLSwapChain constructor.
     * @param canvas The HTML canvas element that the swap chain will use for rendering.
     * @param _graphicsDevice The graphics device.
     */
    public constructor(canvas: HTMLCanvasElement, _graphicsDevice: IGraphicsDevice) {
        this._canvas = canvas;
        this._backBufferSize = vec2.fromValues(this._canvas.width, this._canvas.height);

    }

    /**
     * Always {@link TextureFormat.RGBA8_UNORM}: the WebGL default framebuffer is never sRGB.
     * With sRGB output the main render target pipeline's blit shader encodes instead.
     */
    public readonly textureFormat: TextureFormat = TextureFormat.RGBA8_UNORM;

    /** @inheritdoc */
    public get backBufferSize(): vec2 {
        return this._backBufferSize;
    }

    /** @inheritdoc */
    public resize(size: vec2): void {
        // The canvas size is managed by the application; only track it for the render pass viewport.
        vec2.copy(this._backBufferSize, size);
    }

    /** @inheritdoc */
    public present(): void {
    }

    /** @inheritdoc */
    public dispose(): void {

    }
}