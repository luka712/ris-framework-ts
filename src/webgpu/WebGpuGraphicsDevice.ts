import { AGraphicsDevice, type IGraphicsDeviceDescriptor } from "../core/rendering/AGraphicsDevice.ts";
import type { BlendStateDescriptor } from "../core/rendering/blending/blend-state-descriptor.ts";
import type { SamplerDescriptor } from "../core/rendering/sampler/sampler-descriptor.ts";
import {
    type IBlendState,
    type IGPUInfo,
    type IPrimitiveState,
    type ISampler,
    type ISwapChain,
    type IPrimitiveStateDescriptor,
    type ISwapChainDescriptor,
    type ICanvasManager,
    GpuBackend,
    GpuLimits,
    State,
} from "../api/index.ts";
import { WebGpuGraphicsDeviceFeatures } from "./WebGpuGraphicsDeviceFeatures.ts";
import { WebGPUInfo } from "./WebGpuInfo.ts";
import { WebGpuSwapChain } from "./swap-chain/WebGpuSwapChain.ts";
import { WebGpuSampler } from "./sampler/WebGpuSampler.ts";
import { WebGpuBlendState } from "./blending/WebGpuBlendState.ts";
import { WebGpuPrimitiveState } from "./primitive/WebGpuPrimitiveState.ts";
import { WebGpuUtilities } from "./utilities/WebGpuUtilities.ts";
import type { IGpuCommandEncoder } from "../api/gpu/IGpuCommandEncoder.ts";
import { WebGpuCommandEncoder } from "./WebGpuCommandEncoder.ts";
import type { WebGpuRenderPass } from "./render-pass/WebGpuRenderPass.ts";
import type { WebGpuComputePass } from "./compute/WebGpuComputePass.ts";

/**
 * The WebGPU graphics device. It requests its own adapter and device in {@link initializeAsync},
 * so everything after creation is synchronous like WebGL.
 * @internal
 */
export class WebGpuGraphicsDevice extends AGraphicsDevice {


    /** @inheritdoc */
    public readonly api = GpuBackend.WEB_GPU;

    private readonly _canvasManager: ICanvasManager;
    private _context: GPUCanvasContext = null!;
    private _adapter: GPUAdapter = null!;
    private _device: GPUDevice = null!;
    private _features: WebGpuGraphicsDeviceFeatures = null!;
    private _gpuInfo: WebGPUInfo = null!;
    private _swapChain: WebGpuSwapChain | null = null;

    /**
     * The constructor. Call {@link initializeAsync} before use (done by `Framework.initializeAsync()`).
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

    /**
     * The underlying WebGPU render pass encoder.
     */
    public get gpuRenderPassEncoder(): GPURenderPassEncoder {
        return (this.currentRenderPass as WebGpuRenderPass).gpuRenderPassEncoder;
    }

      /**
     * The underlying WebGPU render compute encoder.
     */
    public get gpuComputePassEncoder(): GPUComputePassEncoder {
        return (this.currentComputePass as WebGpuComputePass).gpuComputePassEncoder!;
    }

    /** @inheritdoc */
    public createCommandEncoder(label?: string): IGpuCommandEncoder {
        return new WebGpuCommandEncoder(this, label);
    }


    /** @inheritDoc */
    public async initializeAsync(): Promise<void> {
        this._validateState("WebGpuGraphicsDevice.initializeAsync");

        this._context = this._canvasManager.canvas.getContext("webgpu") as GPUCanvasContext;
        if (!this._context) {
            throw new Error("WebGpuGraphicsDevice.initializeAsync: canvas.getContext(\"webgpu\") returned null; WebGPU is not available for this canvas (or it already has another context).");
        }

        this._adapter = await WebGpuUtilities.adapter.requestAdapterAsync(this._descriptor.powerPreference);
        this._throwIfDisposedDuringInitialize();
        this._features = new WebGpuGraphicsDeviceFeatures(this._adapter.features);

        this._device = await WebGpuUtilities.device.requestDeviceAsync(this._adapter, this._features.deviceRequiredFeatures, {}, "RisFramework WebGPU device");
        this._throwIfDisposedDuringInitialize();
        this._limits = GpuLimits.fromWebGpuDevice(this._device);
        this._gpuInfo = new WebGPUInfo(this._adapter, this._features);
        this.setupDebugCallback();
        await super.initializeAsync();
    }

    /** @inheritDoc */
    public createSwapChain(_canvas: HTMLCanvasElement, descriptor: ISwapChainDescriptor): ISwapChain {
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
    public pushDebugGroup(_groupName: string): void {

    }

    /** @inheritDoc */
    public popDebugGroup(): void {
    }

    /**
     * Called after each await in {@link initializeAsync}. When {@link dispose} ran meanwhile, destroys a device
     * that was requested after dispose (so it does not leak) and stops initialization.
     * @throws Error when the device was disposed during initialization.
     */
    private _throwIfDisposedDuringInitialize(): void {
        if (this._state == State.CREATED) {
            return;
        }
        this._device?.destroy();
        this._device = null!;
        throw new Error(`WebGpuGraphicsDevice.initializeAsync: the device was disposed during initialization (state ${State[this._state]}).`);
    }

    /** Disposes the swap chain and destroys the GPU device. */
    protected _disposeBackend(): void {
        this._swapChain?.dispose();
        this._swapChain = null;
        this._device?.destroy();
    }
}
