import {vec2} from "gl-matrix";
import {type ISwapChain, SwapChainDescriptor, TextureFormat} from "../../api";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU swap chain, backed by the canvas' `webgpu` context.
 *
 * The canvas is configured as `rgba8unorm` instead of `navigator.gpu.getPreferredCanvasFormat()` (often `bgra8unorm`),
 * because the framework's {@link TextureFormat} has no BGRA format and the main render target uses the swap chain format.
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
     * @param _descriptor The swap chain descriptor. WebGPU canvases always present with FIFO.
     */
    public constructor( graphicsDevice: WebGpuGraphicsDevice, _descriptor?: SwapChainDescriptor) {
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
            TextureFormat.RGBA_8_UNORM,
            this._graphicsDevice.alpha ? "premultiplied" : "opaque");
    }

    /** @inheritDoc */
    public get textureFormat(): TextureFormat {
        return TextureFormat.RGBA_8_UNORM;
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
            this._currentView = this._context.getCurrentTexture().createView();
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
