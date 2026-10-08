import {WebGlSampler} from "./sampler/webgl-sampler";
import {WebGlRenderPass} from "./render-pass/WebGlRenderPass.ts";
import {AGraphicsDevice, type IGraphicsDeviceDescriptor} from "../core/rendering/AGraphicsDevice.ts";
import {type BlendStateDescriptor} from "../core/rendering/blending/blend-state-descriptor";
import {WebGlBlendState} from "./blending/webgl-blend-state";
import {WebGlPrimitiveState} from "./primitive/WebGlPrimitiveState.ts";
import {WebGLGraphicsDeviceFeatures} from "./WebGLGraphicsDeviceFeatures.ts";
import {WebGlSwapChain} from "./swap-chain/WebGlSwapChain.ts";
import {WebGlGpuInfo} from "./WebGlGpuInfo.ts";
import type {SamplerDescriptor} from "../core/rendering/sampler/sampler-descriptor.ts";
import {
    type IBlendState,
    type IGPUInfo, type IPrimitiveState,
    type IRenderPass,
    type ISampler,
    type ISwapChain,
    type IWindowManager,
    PrimitiveStateDescriptor,
    RenderPassDescriptor,
    SwapChainDescriptor
} from "../api/index.ts";

/**
 * Creates WebGL2 enabled graphics device.
 * @internal
 */
export class WebGlGraphicsDevice extends AGraphicsDevice {


    public setupDebugCallback(): void {
        throw new Error("Method not implemented.");
    }

    public frameEnd(): void {
        throw new Error("Method not implemented.");
    }

    public pushDebugGroup(_groupName: string): void {
        throw new Error("Method not implemented.");
    }

    public popDebugGroup(): void {
        throw new Error("Method not implemented.");
    }

    private readonly _windowManager: IWindowManager;
    private _canvas: HTMLCanvasElement = null!;
    private _gl: WebGL2RenderingContext = null!;
    private _features: WebGLGraphicsDeviceFeatures = null!;
    private _gpuInfo: WebGlGpuInfo = null!;

    /**
     * The constructor.
     * @param windowManager The window manager that provides access to the canvas element and other window-related functionalities needed for initializing the graphics device and creating rendering contexts.
     * @param descriptor The descriptor for the graphics device. This is used to configure the graphics device during initialization.
     */
    public constructor(windowManager: IWindowManager, descriptor: IGraphicsDeviceDescriptor) {

        super(descriptor);
        this._windowManager = windowManager;
    }

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
    public initialize(): void {

        this._canvas = this._windowManager.canvas;

        debugger;
        const contextOptions: WebGLContextAttributes = {
            antialias: false,
            alpha: this._descriptor.alpha,
            powerPreference:  this._descriptor.powerPreference,
        };

        this._gl = this._canvas.getContext(
            "webgl2",
            contextOptions,
        ) as WebGL2RenderingContext;

        // If not supported, throw an error.
        if (!this._gl) {
            throw new Error("WebGL not supported.");
        }

        this._features = new WebGLGraphicsDeviceFeatures(this._gl);
        this._gpuInfo = new WebGlGpuInfo(this);

        super.initialize();
    }

    /** @inheritdoc */
    public createSwapChain(canvas: HTMLCanvasElement, _: SwapChainDescriptor): ISwapChain {
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
    public createPrimitiveState(descriptor?: PrimitiveStateDescriptor): IPrimitiveState {
        descriptor = descriptor ?? new PrimitiveStateDescriptor();
        return new WebGlPrimitiveState(this._gl, descriptor);
    }
}