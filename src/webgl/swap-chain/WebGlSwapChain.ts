import { vec2 } from "gl-matrix";
import {type IGraphicsDevice, type ISwapChain, TextureFormat} from "ris-framework-api";
import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";

/**
 * The WebGL implementation of the ISwapChain interface, which manages the swap chain for rendering operations in a WebGL context.
 */
export class WebGlSwapChain implements ISwapChain {

    private readonly _canvas: HTMLCanvasElement
    private readonly _graphicsDevice: WebGlGraphicsDevice;

    private _backBufferSize: vec2;

    /**
     * The WebGLSwapChain constructor.
     * @param canvas The HTML canvas element that the swap chain will use for rendering.
     * @param graphicsDevice The graphics device.
     */
    public constructor(canvas: HTMLCanvasElement, graphicsDevice: IGraphicsDevice) {
        this._canvas = canvas;
        this._graphicsDevice = graphicsDevice as WebGlGraphicsDevice;
        this._backBufferSize = vec2.fromValues(this._canvas.width, this._canvas.height);
        this._canvas.addEventListener('resize', () => {
            this._backBufferSize[0] = this._canvas.width;
            this._backBufferSize[1] = this._canvas.height;
        });
    }


    /** @inheritdoc */
    public get textureFormat(): TextureFormat {
        return TextureFormat.RGBA_8_UNORM;
    }

    /** @inheritdoc */
    public get backBufferSize(): vec2 {
        return this._backBufferSize;
    }

    /** @inheritdoc */
    public resize(_width: number, _height: number): void {
        // Nothing to do here since the canvas size is managed by the application and WebGL will automatically adjust the viewport accordingly.
    }

    /** @inheritdoc */
    public present(): void {
       const gl = this._graphicsDevice.gl;
       gl.viewport(0, 0, this._canvas.width, this._canvas.height);
    }

    /** @inheritdoc */
    public dispose(): void {

    }
}