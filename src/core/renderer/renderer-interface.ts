import { vec2 } from "gl-matrix";
import { TextureSamplerFilteringPreset } from "../rendering/enums";
import type {RenderingLimits} from "./rendering-limits.ts";
import type {Color, IGraphicsDevice, IRenderer} from "ris-framework-api";
import type {TextureFormat} from "ris-framework-api";

export const RenderConfigurationSymbol = Symbol("RenderConfiguration");

/**
 * The configuration for the renderer. This is used to initialize the renderer.
 */
export class RenderConfiguration {

    /**
     * The size of the main frame buffer. This is used to initialize the main render target.
     */
    backBufferSize: vec2 = vec2.fromValues(800, 600);

    /**
     * The preset for texture sampler filtering.
     *  This is used to configure the default texture sampler in the graphics device. 
     * The default texture sampler is used when a texture is sampled without a specific sampler being bound.
     */
    textureFiltering = TextureSamplerFilteringPreset.BILINEAR;
}

/**
 * The interface for renderers.
 */
export interface ITempRenderer extends IRenderer {

    /**
     * The clear color used by the renderer.
     */
    clearColor: Color

    /**
     * The rendering limits of the renderer.
     */
    limits: RenderingLimits | null;

    /**
     * The graphics device used by the renderer. 
     * This is used to create resources and manage the rendering context.
     */
    readonly graphicsDevice: IGraphicsDevice;

    /**
     * The preferred texture format for the renderer.
     * @returns The preferred texture format for the renderer.
     */
    get preferredTextureFormat(): TextureFormat;

    /**
     * The preferred depth stencil format for the renderer.
     * @returns The preferred depth stencil format for the renderer.
     */
    get preferredDepthStencilFormat(): TextureFormat;

    /**
     * The size of the back buffer.
     */
    backBufferSize: vec2;

    /**
     * Whether the back buffer size matches the swap chain size.
     * If <code>true</code>, the renderer will assume that the back buffer size matches the swap chain size,
     * overriding the <code>backBufferSize</code> property.
     */
    backBufferMatchesSwapChain: boolean;

    /**
     * Initializes the renderer.
     */
    initialize(): void;

    /**
     * Performs any additional initialization steps after the main initialization is complete.
     * This can be used to set up resources that depend on the graphics device or swap chain being initialized.
     */
    afterInitialize(): void;

    /**
     * Begins a new render pass.
     */
    beginRenderPass(): void;

    /**
     * Ends the current render pass.
     */
    endRenderPass(): void;
}