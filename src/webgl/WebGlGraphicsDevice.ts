import { WebGlSampler } from "./sampler/webgl-sampler";
import { WebGlRenderPass } from "./render-pass/WebGlRenderPass.ts";
import { AGraphicsDevice, type IGraphicsDeviceDescriptor } from "../core/rendering/AGraphicsDevice.ts";
import { type BlendStateDescriptor } from "../core/rendering/blending/blend-state-descriptor";
import { WebGlBlendState } from "./blending/webgl-blend-state";
import { WebGlPrimitiveState } from "./primitive/WebGlPrimitiveState.ts";
import { WebGlGraphicsDeviceFeatures } from "./WebGLGraphicsDeviceFeatures.ts";
import { WebGlSwapChain } from "./swap-chain/WebGlSwapChain.ts";
import { WebGlGpuInfo } from "./WebGlGpuInfo.ts";
import type { SamplerDescriptor } from "../core/rendering/sampler/sampler-descriptor.ts";
import {
    type IBlendState,
    type IGPUInfo, type IPrimitiveState,
    type IRenderPass,
    type ISampler,
    type ISwapChain,
    type ICanvasManager,
    type IPrimitiveStateDescriptor,
    RenderPassDescriptor,
    type ISwapChainDescriptor,
    RenderingBackend
} from "../api/index.ts";
import type { Spector } from "spectorjs";

/**
 * Creates WebGL2 enabled graphics device.
 * @internal
 */
export class WebGlGraphicsDevice extends AGraphicsDevice {

    private readonly _canvasManager: ICanvasManager;
    private _canvas: HTMLCanvasElement = null!;
    private _gl: WebGL2RenderingContext = null!;
    private _features: WebGlGraphicsDeviceFeatures = null!;
    private _gpuInfo: WebGlGpuInfo = null!;
    private _spector?: Spector;

    /**
     * The constructor.
     * @param canvasManager The window manager that provides access to the canvas element and other window-related functionalities needed for initializing the graphics device and creating rendering contexts.
     * @param descriptor The descriptor for the graphics device. This is used to configure the graphics device during initialization.
     */
    public constructor(canvasManager: ICanvasManager, descriptor: IGraphicsDeviceDescriptor) {

        super(descriptor);
        this._canvasManager = canvasManager;
    }

    /** @inheritdoc */
    public readonly api = RenderingBackend.WEB_GL;

    /**
     * The WebGL rendering context.
     */
    public get gl(): WebGL2RenderingContext {
        return this._gl;
    }

    /** @inheritdoc */
    public get features() {
        return this._features;
    }

    /** @inheritdoc */
    public get gpuInfo(): IGPUInfo {
        return this._gpuInfo;
    }

    /** @inheritdoc */
    public async initializeAsync(): Promise<void> {
        this._validateState("WebGlGraphicsDevice.initializeAsync");

        this._canvas = this._canvasManager.canvas;

        // Loaded on demand so non-debug builds and Node tests never evaluate Spector (it touches `self` at import).
        // Spy before the context is created, so Spector wraps the real WebGL2 context instead of guessing one at capture time.
        if (this._descriptor.debugContext) {
            const { Spector } = await import("spectorjs");
            this._spector = new Spector();
            this._spector.spyCanvas(this._canvas);
        }

        const contextOptions: WebGLContextAttributes = {
            antialias: false,
            alpha: this._descriptor.alpha,
            powerPreference: this._descriptor.powerPreference,
        };

        this._gl = this._canvas.getContext(
            "webgl2",
            contextOptions,
        ) as WebGL2RenderingContext;

        // If not supported, throw an error.
        if (!this._gl) {
            throw new Error("WebGlGraphicsDevice.initializeAsync: WebGL2 is not supported (canvas.getContext(\"webgl2\") returned null).");
        }

        this._features = new WebGlGraphicsDeviceFeatures(this._gl);
        this._gpuInfo = new WebGlGpuInfo(this);

        await super.initializeAsync();
    }

    /** @inheritdoc */
    public createSwapChain(canvas: HTMLCanvasElement, _: ISwapChainDescriptor): ISwapChain {
        return new WebGlSwapChain(canvas, this);
    }

    /** @inheritdoc */
    public createSampler(descriptor?: SamplerDescriptor): ISampler {
        return new WebGlSampler(this, descriptor);
    }

    /** @inheritdoc */
    public createRenderPass(descriptor: RenderPassDescriptor): IRenderPass {
        return new WebGlRenderPass(this, descriptor);
    }

    /** @inheritdoc */
    public createBlendState(descriptor: BlendStateDescriptor): IBlendState {
        return new WebGlBlendState(this, descriptor);
    }

    /** @inheritdoc */
    public createPrimitiveState(descriptor?: IPrimitiveStateDescriptor): IPrimitiveState {
        return new WebGlPrimitiveState(this._gl, descriptor);
    }

    /** @inheritdoc */
    public pushDebugGroup(_groupName: string): void {
        this._spector?.setMarker(_groupName);
    }

    /** @inheritdoc */
    public popDebugGroup(): void {
        this._spector?.clearMarker();
    }

    /** @inheritdoc */
    public setupDebugCallback(): void {
        this._spector?.onError.add(error => {
            debugger;
            console.error(error);
        })
    }

    /** Not implemented for WebGL2; always throws. */
    public frameEnd(): void {
        throw new Error("WebGlGraphicsDevice.frameEnd: Not implemented for WebGL2.");
    }

    /**
     * Loses the WebGL context right away instead of waiting for garbage collection.
     * Browsers cap live WebGL contexts, so switching backends repeatedly would otherwise run out.
     */
    protected _disposeBackend(): void {
        this._gl?.getExtension("WEBGL_lose_context")?.loseContext();
        this._gl = null!;
    }
}
