import {vec2} from "gl-matrix";
import {type ISwapChain, SwapChainDescriptor, TextureFormat} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {GpuTextureUsage, type GpuCanvasContext, type GpuTextureView} from "../WebGpuTypes.ts";

/**
 * The WebGPU swap chain, backed by the canvas' `webgpu` context.
 *
 * The canvas is configured as `rgba8unorm` instead of `navigator.gpu.getPreferredCanvasFormat()` (often `bgra8unorm`),
 * because the framework's {@link TextureFormat} has no BGRA format and the main render target uses the swap chain format.
 * @internal
 */
export class WebGpuSwapChain implements ISwapChain {

    private readonly _canvas: HTMLCanvasElement;
    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _context: GpuCanvasContext;
    private readonly _backBufferSize: vec2;
    private _currentView: GpuTextureView | null = null;

    /**
     * The constructor.
     * @param canvas The canvas.
     * @param graphicsDevice The graphics device.
     * @param _descriptor The swap chain descriptor. WebGPU canvases always present with FIFO.
     */
    public constructor(canvas: HTMLCanvasElement, graphicsDevice: WebGpuGraphicsDevice, _descriptor?: SwapChainDescriptor) {
        this._canvas = canvas;
        this._graphicsDevice = graphicsDevice;
        const context = canvas.getContext("webgpu" as "webgl2") as unknown as GpuCanvasContext | null;
        if (!context) {
            throw new Error("WebGPU canvas context is not available.");
        }
        this._context = context;
        this._backBufferSize = vec2.fromValues(canvas.width, canvas.height);
        this._configure();
    }

    private _configure(): void {
        this._context.configure({
            device: this._graphicsDevice.device,
            format: "rgba8unorm",
            usage: GpuTextureUsage.RENDER_ATTACHMENT,
            alphaMode: this._graphicsDevice.alpha ? "premultiplied" : "opaque",
        });
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
    public get currentTextureView(): GpuTextureView {
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
        this._canvas.width = width;
        this._canvas.height = height;
        this._backBufferSize[0] = width;
        this._backBufferSize[1] = height;
    }

    /** @inheritDoc */
    public present(): void {
        // The browser presents the canvas texture after the task; the next frame needs a fresh texture.
        this._currentView = null;
        this._backBufferSize[0] = this._canvas.width;
        this._backBufferSize[1] = this._canvas.height;
    }

    /** @inheritDoc */
    public dispose(): void {
        this._currentView = null;
        this._context.unconfigure();
    }
}
