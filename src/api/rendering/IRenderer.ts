import type { IGraphicsDevice } from "./IGraphicsDevice.ts";
import {TextureFormat} from "./texture/TextureFormat.ts";
import {Color} from "../data/Color.ts";
import {RenderingBackend} from "./RenderingBackend.ts";
import {vec2} from "gl-matrix";
import type {PowerPreferenceType} from "./PowerPreference.ts";
import type {TextureSamplerFilteringPreset} from "../../core/rendering/enums.ts";
import type {TextureColorSpace} from "./enums.ts";


/**
 * The configuration for the renderer. This is used to initialize the renderer.
 * @internal
 */
export interface IRendererConfiguration {

    /**The size of the main frame buffer. */
    backBufferSize: vec2;

    /** Should back buffer use alpha. */
    alpha: boolean;

    /** The preference when it comes to selecting GPU device. Only makes sense to set on multi-GPU devices. */
    powerPreference: PowerPreferenceType;

    /**
     * The preset for texture sampler filtering.
     * This is used to configure the default texture sampler in the graphics device.
     * The default texture sampler is used when a texture is sampled without a specific sampler being bound.
     */
    textureFiltering: TextureSamplerFilteringPreset;

    /** The desired texture color space. */
    textureColorSpace: TextureColorSpace;
}

/**
 * The interface for a renderer.
 * @public
 */
export interface IRenderer {

    /**
     * The graphics device used by the renderer.
     */
    readonly graphicsDevice: IGraphicsDevice;

    /**
     * The preferred texture format.
     * This will encode texture which do not specify texture format to:
     * - {@link TextureFormat.} // TODO: describe SRGB depending on TextureSurfaceFormat requested
     * - {@link TextureFormat.} // TODO: describe RGBA depending on TextureSurfaceFormat requested
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
     * Setting this will have no effect if `backBufferMatchesSwapChain` is set to true.
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