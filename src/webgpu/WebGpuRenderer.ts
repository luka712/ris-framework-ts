import {ARenderer} from "../core/rendering/ARenderer.ts";
import {type IFramework, type IGraphicsDevice, type IRenderPass, type IRenderPassDescriptor, type IRendererConfiguration} from "../api/index.ts";
import type { WebGpuGraphicsDevice } from "./WebGpuGraphicsDevice.ts";
import { WebGpuRenderPass } from "./render-pass/WebGpuRenderPass.ts";

/**
 * The WebGPU renderer.
 * The framework creates the {@link IGraphicsDevice} and initializes it before {@link initializeAsync}.
 * @internal
 */
export class WebGpuRenderer extends ARenderer {

    /**
     * The constructor.
     * @param framework The framework.
     * @param renderConfiguration The renderer configuration.
     * @param graphicsDevice The graphics device.
     */
    public constructor(framework: IFramework, renderConfiguration: IRendererConfiguration, graphicsDevice: IGraphicsDevice) {
        super(framework, renderConfiguration, graphicsDevice);
    }

    /** @inheritdoc */
    protected _createRenderPass(descriptor: IRenderPassDescriptor): IRenderPass {
        const desc = descriptor ? { ...descriptor } : {};
        return new WebGpuRenderPass(this.graphicsDevice as WebGpuGraphicsDevice, desc);
    }
}
