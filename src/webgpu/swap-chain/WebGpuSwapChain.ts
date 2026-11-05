import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";
import { vec2 } from "gl-matrix";
import { type ISwapChain, type ISwapChainDescriptor, TextureFormat } from "../../api";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU swap chain, backed by the canvas' `webgpu` context.
 *
 * The canvas is configured as `rgba8unorm` instead of `navigator.gpu.getPreferredCanvasFormat()` (often `bgra8unorm`),
 * because the framework's {@link TextureFormat} has no BGRA format.
 *
 * The swap chain is always linear (RGBA8_UNORM), whatever the output color space: with sRGB output the renderer draws into the
 * main render target through its RGBA8_UNORM_SRGB view (the hardware encodes on write), and the main render target pipeline
 * copies the already encoded bytes through the RGBA8_UNORM view. Encoding here as well would encode twice.
 * @internal
 */
export class WebGpuSwapChain implements ISwapChain {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _context: GPUCanvasContext;
    private _device: GPUDevice;
    private readonly _backBufferSize: vec2;
    private _currentView: GPUTextureView | null = null;

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param _descriptor The swap chain descriptor. WebGPU canvases always present with FIFO, and the output color space is handled by the main render target view.
     */
    public constructor(graphicsDevice: WebGpuGraphicsDevice, _descriptor: ISwapChainDescriptor) {
        this._graphicsDevice = graphicsDevice;
        const canvas = graphicsDevice.canvasManager.canvas;
        this._context = graphicsDevice.context;
        this._device = graphicsDevice.device;
        this._backBufferSize = vec2.fromValues(canvas.width, canvas.height);
        this._configure();
    }

    private _configure(): void {

        WebGpuUtilities.context.configure(
            this._context,
            this._device,
            TextureFormat.RGBA8_UNORM,
            [TextureFormat.RGBA8_UNORM],
            this._graphicsDevice.alpha ? "premultiplied" : "opaque");
    }

    /** The format of the canvas texture views. Always {@link TextureFormat.RGBA8_UNORM} (see the class comment). */
    public get textureFormat(): TextureFormat {
        return TextureFormat.RGBA8_UNORM;
    }

    /** @inheritDoc */
    public get backBufferSize(): vec2 {
        return this._backBufferSize;
    }

    /**
     * The view of the current canvas texture. Acquired once per frame and released on {@link present}.
     */
    public get currentTextureView(): GPUTextureView {
        if (!this._currentView) {
            this._currentView = this._context.getCurrentTexture().createView({format: WebGpuConverter.convertTextureFormat(this.textureFormat)});
        }
        return this._currentView;
    }

    /** @inheritDoc */
    public resize(width: number, height: number): void {
        if (width <= 0 || height <= 0) {
            return;
        }
        this._currentView = null;
        this._backBufferSize[0] = width;
        this._backBufferSize[1] = height;
    }

    /** @inheritDoc */
    public present(): void {
        // The browser presents the canvas texture after the task; the next frame needs a fresh texture.
        this._currentView = null;
    }

    /** @inheritDoc */
    public dispose(): void {
        this._currentView = null;
        this._context.unconfigure();
    }
}
