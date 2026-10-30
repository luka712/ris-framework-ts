import {type IRendererConfiguration} from "../api/rendering/renderer-interface.ts";
import {ARenderer} from "../core/rendering/ARenderer.ts";
import {type IFramework, type IGraphicsDevice, PowerPreferenceType, RenderingBackend} from "../api/index.ts";
import {WebGpuGraphicsDevice} from "./WebGpuGraphicsDevice.ts";
import {getNavigatorGpu, type GpuAdapter, type GpuDevice} from "./WebGpuTypes.ts";

/**
 * The WebGPU renderer. WebGPU hands out the adapter and device asynchronously, so call
 * {@link acquireDeviceAsync} (done by `Framework.initializeAsync()`) before {@link initialize}.
 * @internal
 */
export class WebGpuRenderer extends ARenderer {

    private readonly _renderConfiguration: IRendererConfiguration;
    private _adapter: GpuAdapter | null = null;
    private _device: GpuDevice | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param renderConfiguration The renderer configuration.
     */
    public constructor(framework: IFramework, renderConfiguration: IRendererConfiguration) {
        super(framework);
        this._renderConfiguration = renderConfiguration;
        this.backend = RenderingBackend.WEB_GPU;
    }

    /** Whether the browser exposes `navigator.gpu`. */
    public static isSupported(): boolean {
        return getNavigatorGpu() !== undefined;
    }

    /**
     * Requests the adapter and device. Throws when WebGPU is unavailable or no adapter is found.
     */
    public async acquireDeviceAsync(): Promise<void> {
        const gpu = getNavigatorGpu();
        if (!gpu) {
            throw new Error("WebGPU is not supported: navigator.gpu is missing.");
        }
        const preference = this._renderConfiguration.powerPreference;
        const adapter = await gpu.requestAdapter(
            preference && preference !== PowerPreferenceType.DEFAULT
                ? {powerPreference: preference as unknown as "low-power" | "high-performance"}
                : undefined);
        if (!adapter) {
            throw new Error("WebGPU is not supported: no adapter was found.");
        }
        // Compression features are not requested yet; KTX2 is not implemented for WebGPU.
        this._device = await adapter.requestDevice({label: "RisFramework WebGPU device"});
        this._adapter = adapter;
    }

    /** @inheritDoc */
    protected createGraphicsDevice(): IGraphicsDevice {
        if (!this._adapter || !this._device) {
            throw new Error("WebGpuRenderer: the device is not acquired. Use Framework.initializeAsync() for WebGPU.");
        }
        return new WebGpuGraphicsDevice(this._framework.windowManager, {
            samplerFilteringPreset: this._renderConfiguration.textureFiltering,
            alpha: this._renderConfiguration.alpha,
            powerPreference: this._renderConfiguration.powerPreference,
        }, this._adapter, this._device);
    }
}
