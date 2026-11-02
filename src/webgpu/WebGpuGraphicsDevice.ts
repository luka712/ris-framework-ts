import {AGraphicsDevice, type IGraphicsDeviceDescriptor} from "../core/rendering/AGraphicsDevice.ts";
import type {BlendStateDescriptor} from "../core/rendering/blending/blend-state-descriptor.ts";
import type {SamplerDescriptor} from "../core/rendering/sampler/sampler-descriptor.ts";
import {
    type IBlendState,
    type IGPUInfo,
    type IPrimitiveState,
    type IRenderPass,
    type ISampler,
    type ISwapChain,
    type IPrimitiveStateDescriptor,
    RenderPassDescriptor,
    SwapChainDescriptor,
    type ICanvasManager,
} from "../api/index.ts";
import {WebGpuGraphicsDeviceFeatures} from "./WebGpuGraphicsDeviceFeatures.ts";
import {WebGPUInfo} from "./WebGpuInfo.ts";
import {WebGpuSwapChain} from "./swap-chain/WebGpuSwapChain.ts";
import {WebGpuSampler} from "./sampler/WebGpuSampler.ts";
import {WebGpuRenderPass} from "./render-pass/WebGpuRenderPass.ts";
import {WebGpuBlendState} from "./blending/WebGpuBlendState.ts";
import {WebGpuPrimitiveState} from "./primitive/WebGpuPrimitiveState.ts";
import { WebGpuUtilities } from "./utilities/WebGpuUtilities.ts";

/**
 * The WebGPU graphics device. It requests its own adapter and device in {@link initializeAsync},
 * so everything after creation is synchronous like WebGL.
 * @internal
 */
export class WebGpuGraphicsDevice extends AGraphicsDevice {

    private readonly _canvasManager: ICanvasManager;
    private _context: GPUCanvasContext = null!;
    private _adapter: GPUAdapter = null!;
    private _device: GPUDevice = null!;
    private _features: WebGpuGraphicsDeviceFeatures = null!;
    private _gpuInfo: WebGPUInfo = null!;
    private _swapChain: WebGpuSwapChain | null = null;

    /**
     * The render pass encoder of the pass that is currently open, or null between passes.
     * Set by {@link WebGpuRenderPass.beginPass}, like `currentRenderPassEncoder` in the C# device.
     */
    public currentRenderPassEncoder: GPURenderPassEncoder | null = null;


    /**
     * The constructor. Call {@link initializeAsync} before use (done by `ARenderer.initializeAsync()`).
     * @param canvasManager The canvas manager.
     * @param descriptor The device descriptor.

     */
    public constructor(canvasManager: ICanvasManager, descriptor: IGraphicsDeviceDescriptor) {
        super(descriptor);
        this._canvasManager = canvasManager;
    }

    /** The WebGPU canvas context. */
    public get context(): GPUCanvasContext {
        return this._context;
    }

    /** The WebGPU device. */
    public get device(): GPUDevice {
        return this._device;
    }

    /** The WebGPU adapter. */
    public get adapter(): GPUAdapter {
        return this._adapter;
    }

    /** Whether the canvas should keep its alpha channel. */
    public get alpha(): boolean {
        return this._descriptor.alpha;
    }

    /** The swap chain, once created. */
    public get swapChain(): WebGpuSwapChain | null {
        return this._swapChain;
    }

    /** The window manager. */
    public get canvasManager(): ICanvasManager {
        return this._canvasManager;
    }

    /** @inheritDoc */
    public get features(): WebGpuGraphicsDeviceFeatures {
        return this._features;
    }

    /** @inheritDoc */
    public get gpuInfo(): IGPUInfo {
        return this._gpuInfo;
    }

    /** The current render pass encoder. Throws when no pass is open. */
    public get renderPassEncoder(): GPURenderPassEncoder {
        if (!this.currentRenderPassEncoder) {
            throw new Error("WebGpuGraphicsDevice: no render pass is open. Draw calls must happen between beginRenderPass and endRenderPass.");
        }
        return this.currentRenderPassEncoder;
    }

    /** @inheritDoc */
    public async initializeAsync(): Promise<void> {


        this._context = this._canvasManager.canvas.getContext("webgpu") as GPUCanvasContext;
        if (!this._context) {
            throw new Error("WebGPU canvas context is not available.");
        }


        this._adapter = await WebGpuUtilities.adapter.requestAdapterAsync(this._descriptor.powerPreference);
        this._features = new WebGpuGraphicsDeviceFeatures(this._adapter.features);

        this._device  = await WebGpuUtilities.device.requestDeviceAsync(this._adapter, this._features.deviceRequiredFeatures, {}, "RisFramework WebGPU device");
        this._gpuInfo = new WebGPUInfo(this._adapter, this._features);
        this.setupDebugCallback();
        await super.initializeAsync();  
    }

    /** @inheritDoc */
    public createSwapChain(_canvas: HTMLCanvasElement, descriptor: SwapChainDescriptor): ISwapChain {
        // The swap chain reads the canvas from the device's canvas manager, which is the same canvas.
        this._swapChain?.dispose();
        this._swapChain = new WebGpuSwapChain(this, descriptor);
        return this._swapChain;
    }

    /** @inheritDoc */
    public createSampler(descriptor?: SamplerDescriptor): ISampler {
        return new WebGpuSampler(this, descriptor);
    }

    /** @inheritDoc */
    public createRenderPass(descriptor: RenderPassDescriptor): IRenderPass {
        return new WebGpuRenderPass(this, descriptor);
    }

    /** @inheritDoc */
    public createBlendState(descriptor: BlendStateDescriptor): IBlendState {
        return new WebGpuBlendState(descriptor);
    }

    /** @inheritDoc */
    public createPrimitiveState(descriptor?: IPrimitiveStateDescriptor): IPrimitiveState {
        return new WebGpuPrimitiveState(descriptor);
    }

    /** @inheritDoc */
    public setupDebugCallback(): void {
        this._device.addEventListener("uncapturederror", event => {
            console.error(`WebGPU error: ${event.error.message}`);
        });
        this._device.lost.then(info => {
            if (info.reason !== "destroyed") {
                console.error(`WebGPU device lost (${info.reason}): ${info.message}`);
            }
        }).catch(() => { /* ignore */ });
    }

    /** @inheritDoc */
    public frameEnd(): void {
        // Command buffers are submitted at the end of every render pass, so nothing is pending here.
    }

    /** @inheritDoc */
    public pushDebugGroup(groupName: string): void {
        this.currentRenderPassEncoder?.pushDebugGroup(groupName);
    }

    /** @inheritDoc */
    public popDebugGroup(): void {
        this.currentRenderPassEncoder?.popDebugGroup();
    }

    /** @inheritDoc */
    public dispose(): void {
        super.dispose();
        this._swapChain?.dispose();
        this._swapChain = null;
        this._device.destroy();
    }
}
