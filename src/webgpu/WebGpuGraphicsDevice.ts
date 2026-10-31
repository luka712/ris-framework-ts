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
    type IWindowManager,
    PrimitiveStateDescriptor,
    RenderPassDescriptor,
    SwapChainDescriptor,
} from "../api/index.ts";
import {getNavigatorGpu, type GpuAdapter, type GpuDevice, type GpuRenderPassEncoder} from "./WebGpuTypes.ts";
import {PowerPreferenceType} from "../api/rendering/PowerPreference.ts";
import {WebGpuGraphicsDeviceFeatures} from "./WebGpuGraphicsDeviceFeatures.ts";
import {WebGpuGpuInfo} from "./WebGpuGpuInfo.ts";
import {WebGpuSwapChain} from "./swap-chain/WebGpuSwapChain.ts";
import {WebGpuSampler} from "./sampler/WebGpuSampler.ts";
import {WebGpuRenderPass} from "./render-pass/WebGpuRenderPass.ts";
import {WebGpuBlendState} from "./blending/WebGpuBlendState.ts";
import {WebGpuPrimitiveState} from "./primitive/WebGpuPrimitiveState.ts";

/**
 * The WebGPU graphics device. It requests its own adapter and device in {@link createAsync},
 * so everything after creation is synchronous like WebGL.
 * @internal
 */
export class WebGpuGraphicsDevice extends AGraphicsDevice {

    private readonly _windowManager: IWindowManager;
    private readonly _adapter: GpuAdapter;
    private readonly _device: GpuDevice;
    private _features: WebGpuGraphicsDeviceFeatures = null!;
    private _gpuInfo: WebGpuGpuInfo = null!;
    private _swapChain: WebGpuSwapChain | null = null;

    /**
     * The render pass encoder of the pass that is currently open, or null between passes.
     * Set by {@link WebGpuRenderPass.beginPass}, like `currentRenderPassEncoder` in the C# device.
     */
    public currentRenderPassEncoder: GpuRenderPassEncoder | null = null;

    /**
     * Creates the graphics device: requests the WebGPU adapter and device.
     * Throws when WebGPU is unavailable or no adapter is found.
     * @param windowManager The window manager.
     * @param descriptor The device descriptor.
     * @returns The created graphics device.
     */
    public static async createAsync(windowManager: IWindowManager, descriptor: IGraphicsDeviceDescriptor): Promise<WebGpuGraphicsDevice> {
        const gpu = getNavigatorGpu();
        if (!gpu) {
            throw new Error("WebGPU is not supported: navigator.gpu is missing.");
        }
        const preference = descriptor.powerPreference;
        const adapter = await gpu.requestAdapter(
            preference && preference !== PowerPreferenceType.DEFAULT
                ? {powerPreference: preference as unknown as "low-power" | "high-performance"}
                : undefined);
        if (!adapter) {
            throw new Error("WebGPU is not supported: no adapter was found.");
        }
        // WebGPU only enables the features that are requested, so ask for every compression family the adapter has.
        const requiredFeatures = ["texture-compression-bc", "texture-compression-etc2", "texture-compression-astc"]
            .filter(feature => adapter.features.has(feature));
        const device = await adapter.requestDevice({label: "RisFramework WebGPU device", requiredFeatures});
        return new WebGpuGraphicsDevice(windowManager, descriptor, adapter, device);
    }

    /**
     * The constructor. Use {@link createAsync} to create the device.
     * @param windowManager The window manager.
     * @param descriptor The device descriptor.
     * @param adapter The WebGPU adapter.
     * @param device The WebGPU device.
     */
    private constructor(windowManager: IWindowManager, descriptor: IGraphicsDeviceDescriptor, adapter: GpuAdapter, device: GpuDevice) {
        super(descriptor);
        this._windowManager = windowManager;
        this._adapter = adapter;
        this._device = device;
    }

    /** The WebGPU device. */
    public get device(): GpuDevice {
        return this._device;
    }

    /** The WebGPU adapter. */
    public get adapter(): GpuAdapter {
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
    public get windowManager(): IWindowManager {
        return this._windowManager;
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
    public get renderPassEncoder(): GpuRenderPassEncoder {
        if (!this.currentRenderPassEncoder) {
            throw new Error("WebGpuGraphicsDevice: no render pass is open. Draw calls must happen between beginRenderPass and endRenderPass.");
        }
        return this.currentRenderPassEncoder;
    }

    /** @inheritDoc */
    public initialize(): void {
        this._features = new WebGpuGraphicsDeviceFeatures(this._device.features);
        this._gpuInfo = new WebGpuGpuInfo(this._adapter, this._features);
        this.setupDebugCallback();
        super.initialize();
    }

    /** @inheritDoc */
    public createSwapChain(canvas: HTMLCanvasElement, descriptor: SwapChainDescriptor): ISwapChain {
        this._swapChain?.dispose();
        this._swapChain = new WebGpuSwapChain(canvas, this, descriptor);
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
    public createPrimitiveState(descriptor?: PrimitiveStateDescriptor): IPrimitiveState {
        return new WebGpuPrimitiveState(descriptor ?? new PrimitiveStateDescriptor());
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
