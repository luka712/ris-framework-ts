import {ARenderer} from "../core/rendering/ARenderer.ts";
import type {
    IFramework,
    IGraphicsDevice,
    IRenderPass,
    IRenderPassDescriptor,
    IRendererConfiguration,
} from "../api/index.ts";
import type { WebGlGraphicsDevice } from "./WebGlGraphicsDevice.ts";
import { WebGlRenderPass } from "./render-pass/WebGlRenderPass.ts";

/**
 * A WebGL renderer.
 * The framework creates the {@link IGraphicsDevice} and passes it to the constructor.
 */
export class WebGlRenderer extends ARenderer {

    /**
     * The constructor.
     * @param framework The framework.
     * @param renderConfiguration The render configuration. This is used to initialize the renderer.
     * @param graphicsDevice The graphics device.
     */
    constructor(
        framework: IFramework,
        renderConfiguration: IRendererConfiguration,
        graphicsDevice: IGraphicsDevice) {
        super(framework, renderConfiguration, graphicsDevice);
    }

    /** @inheritdoc */
    public createRenderPass(descriptor: IRenderPassDescriptor): IRenderPass {
        const desc = descriptor ? { ...descriptor } : {};
        return new WebGlRenderPass(this.graphicsDevice as WebGlGraphicsDevice, desc);
    }
}
