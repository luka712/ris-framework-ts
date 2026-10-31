import { vec2 } from "gl-matrix";
import type {RenderingLimits} from "./rendering-limits.ts";
import type { IRenderer} from "../index.ts";
import type {TextureFormat} from "../index.ts";




/**
 * The interface for renderers.
 */
export interface ITempRenderer extends IRenderer {

    /**
     * The rendering limits of the renderer.
     */
    limits: RenderingLimits | null;

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