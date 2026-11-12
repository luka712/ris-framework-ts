import {ARenderer} from "../core/rendering/ARenderer.ts";
import {type IFramework, type IGraphicsDevice, type IRendererConfiguration, RenderingBackend} from "../api/index.ts";
import {WebGpuGraphicsDevice} from "./WebGpuGraphicsDevice.ts";

/**
 * The WebGPU renderer. WebGPU hands out the adapter and device asynchronously; the graphics device
 * requests them in its `initializeAsync()`, called from {@link initializeAsync}.
 * @internal
 */
export class WebGpuRenderer extends ARenderer {

    /**
     * The constructor.
     * @param framework The framework.
     * @param renderConfiguration The renderer configuration.
     */
    public constructor(framework: IFramework, renderConfiguration: IRendererConfiguration) {
        super(framework, renderConfiguration);
        this.backend = RenderingBackend.WEB_GPU;
    }


    /** @inheritDoc */
    protected createGraphicsDevice(): IGraphicsDevice {
        return new WebGpuGraphicsDevice(this._framework.canvasManager, {
            samplerFilteringPreset: this._renderConfiguration.textureFiltering,
            alpha: this._renderConfiguration.alpha,
            powerPreference: this._renderConfiguration.powerPreference,
        });
    }
}
