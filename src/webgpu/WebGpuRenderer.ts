import {ARenderer} from "../core/rendering/ARenderer.ts";
import {type IFramework, type IGraphicsDevice, type IRendererConfiguration, RenderingBackend} from "../api/index.ts";
import {WebGpuGraphicsDevice} from "./WebGpuGraphicsDevice.ts";
import {getNavigatorGpu} from "./WebGpuTypes.ts";

/**
 * The WebGPU renderer. WebGPU hands out the adapter and device asynchronously, so call
 * {@link acquireDeviceAsync} (done by `Framework.initializeAsync()`) before {@link initialize}.
 * @internal
 */
export class WebGpuRenderer extends ARenderer {

    private _createdDevice: WebGpuGraphicsDevice | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param renderConfiguration The renderer configuration.
     */
    public constructor(framework: IFramework, renderConfiguration: IRendererConfiguration) {
        super(framework, renderConfiguration);
        this.backend = RenderingBackend.WEB_GPU;
    }

    /** Whether the browser exposes `navigator.gpu`. */
    public static isSupported(): boolean {
        return getNavigatorGpu() !== undefined;
    }

    /**
     * Creates the graphics device, which requests its own adapter and device.
     * Throws when WebGPU is unavailable or no adapter is found.
     */
    public async acquireDeviceAsync(): Promise<void> {
        this._createdDevice = await WebGpuGraphicsDevice.createAsync(this._framework.windowManager, {
            samplerFilteringPreset: this._renderConfiguration.textureFiltering,
            alpha: this._renderConfiguration.alpha,
            powerPreference: this._renderConfiguration.powerPreference,
        });
    }

    /** @inheritDoc */
    protected createGraphicsDevice(): IGraphicsDevice {
        if (!this._createdDevice) {
            throw new Error("WebGpuRenderer: the device is not created. Use Framework.initializeAsync() for WebGPU.");
        }
        return this._createdDevice;
    }
}
