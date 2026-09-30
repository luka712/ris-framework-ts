import {IGraphicsDevice} from "./IGraphicsDevice";
import {TextureFormat} from "./texture/TextureFormat";
import {Color} from "../data/Color";
import {RenderingBackend} from "./RenderingBackend";
import {vec2} from "gl-matrix";


/**
 * The interface for a renderer.
 */
export interface IRenderer {

    /**
     * The graphics device used by the renderer.
     */
    readonly graphicsDevice: IGraphicsDevice;

    /**
     * The surface preferred a texture format.
     */
    readonly preferredTextureFormat: TextureFormat;

    /**
     * The preferred depth stencil format.
     */
    readonly preferredDepthStencilFormat: TextureFormat;

    /**
     * The clear color of the renderer.
     * Framebuffer will be cleared with this color at the beginning of the frame.
     */
    clearColor: Color;

    /**
     * The renderer type.
     */
    readonly backend: RenderingBackend;

    /**
     * The size of the back buffer.
     * This is the size of the framebuffer that the renderer will render to by default, before rendering to
     * the swap chain's back buffer.
     * This can be different from the swap chain's back buffer size and can be used to render at a
     * different resolution than the screen resolution.
     * Setting this will have no effect if  is set to true.
     */
    backBufferSize: vec2;

    /**
     * The new size of the renderer.
     */
    addOnResizedListener(event: (sender: any, e: vec2) => void): void;

    /**
     * The new size of the renderer.
     */
    removeOnResizedListener(event: (sender: any, e: vec2) => void): void;
    /**
     * After initialization.
     */
    afterInitialize(): void;

    /**
     * The compute pass. Runs before the rendering pass.
     */
    beginComputePass(): void;

    /**
     * The end of compute pass. Ends run before the rendering pass.
     */
    endComputePass(): void;

    /**
     * Should be called at the beginning of the frame.
     * Clears the buffer and prepares the renderer for rendering.
     */
    beginRenderPass(): void;

    /**
     * Should be called at the end of the frame.
     * Ends the rendering and submits the frame to the screen.
     */
    endRenderPass(): void;
}