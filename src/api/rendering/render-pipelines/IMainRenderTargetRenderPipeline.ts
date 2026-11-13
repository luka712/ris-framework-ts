import type { IRenderPipeline } from "./IRenderPipeline.ts";
import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { OutputColorSpace } from "../enums.ts";

/**
 * Pipeline that is used in renderer as
 * a pass that renders from the main frame buffer to the screen.
 */
export interface IMainRenderTargetRenderPipeline extends IRenderPipeline {

    /**
     * The texture that is used as a main frame buffer.
     * The pipeline will render this texture to the screen.
     */
    readonly mainRenderTarget: ITexture2D;

    /**
     * Whether the main render target is flipped vertically when drawn to the screen.
     * Written into the blit uniform buffer as 0 or 1.
     * WebGL defaults to true (default framebuffer origin is bottom-left).
     * WebGPU defaults to false (texture and framebuffer origin are top-left).
     */
    flipY: boolean;

    /**
     * The output color space for the blit to the screen.
     * - {@link OutputColorSpace.NONE}: pass sampled values through (no encode).
     * - {@link OutputColorSpace.SRGB}: encode linear values to sRGB in the blit shader (both backends;
     *   the main render target stays {@link TextureFormat.RGBA8_UNORM} / linear).
     * By default, {@link OutputColorSpace.NONE}. Set by the renderer when `renderer.outputColorSpace` changes.
     */
    outputColorSpace: OutputColorSpace;

    /**
     * The gamma used when {@link outputColorSpace} is {@link OutputColorSpace.SRGB}.
     * Encoding is `pow(color, 1 / gamma)`. By default, 2.2.
     */
    gamma: number;

    /** Render to the screen. */
    render(): void;

}
