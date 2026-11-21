import type { IGraphicsDevice } from "../IGraphicsDevice.ts";
import {TextureFormat} from "../texture/TextureFormat.ts";
import {Color} from "../../data/Color.ts";
import {vec2} from "gl-matrix";
import type {PowerPreferenceType} from "../PowerPreference.ts";
import type {TextureSamplerFilteringPreset} from "../../../core/rendering/enums.ts";
import type {OutputColorSpace} from "./enums.ts";
import type { IRenderPass } from "./renderpass/IRenderPass.ts";
import type { IRenderPassDescriptor } from "./renderpass/RenderPassDescriptor.ts";
import type { State } from "../../data/State.ts";
import type { IDeferredDisposable, IDisposable } from "../../_export.ts";

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

    /**
     * The output color space. By default, {@link OutputColorSpace.NONE}: no color management, values are written to the screen as-is.
     * Use {@link OutputColorSpace.SRGB} to encode linear shader output to sRGB once at present. Material shaders never convert gamma in either mode.
     */
    outputColorSpace: OutputColorSpace;
}

/**
 * The interface for a renderer.
 * @public
 */
export interface IRenderer extends IDisposable {

    /** The lifecycle state. */
    readonly state: State;

    /**
     * The graphics device used by the renderer.
     * The framework creates, initializes and owns this device and injects it into the renderer.
     */
    readonly graphicsDevice: IGraphicsDevice;

    /**
     * The preferred texture format, derived from the current {@link IRenderer.outputColorSpace}.
     * Used for the main render target and for images that specify neither a texture format nor a color space:
     * - {@link TextureFormat.RGBA8_UNORM_SRGB} when the output color space is {@link OutputColorSpace.SRGB}.
     * - {@link TextureFormat.RGBA8_UNORM} when the output color space is {@link OutputColorSpace.NONE} (the default), so it is fully pass-through.
     * KTX2 files follow their own color space instead.
     */
    readonly preferredTextureFormat: TextureFormat;

    /** The output color space: how the final image is encoded for the screen. */
    outputColorSpace: OutputColorSpace;

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

    /** Initializes the renderer asynchronously. The graphics device must already be initialized. */
    initializeAsync(): Promise<void>;

    /**
     * After initialization.
     * @internal
     */
    afterInitialize(): void;

    /**
     * The main render pass, which draws to the main render target.
     * @public
     */
    readonly mainRenderPass: IRenderPass;

    /**
     * Creates a render pass and queues it to run after the main render pass.
     * @param descriptor The render pass descriptor. When no command encoder is set, the main encoder is used.
     * @public
     */
    createRenderPass(descriptor: IRenderPassDescriptor): IRenderPass;

    /**
     * Should be called at the beginning of the frame.
     * Clears the buffer and prepares the renderer for rendering.
     * @internal
     */
    beginRenderPass(): void;

    /**
     * Should be called at the end of the frame.
     * Ends the rendering and submits the frame to the screen.
     * @internal
     */
    endRenderPass(): void;
}
