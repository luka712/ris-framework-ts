import { OutputColorSpace } from "../enums.ts";
import { SurfacePresentMode } from "./SurfacePresentMode.ts";

/**
 * The description of a swap chain, which is used to create a swap chain for the graphics device.
 */
export interface ISwapChainDescriptor {

    /**
     * The width of the back buffer.
     * By default, 0.
     */
    width?: number;

    /**
     * The height of the back buffer.
     * By default, 0.
     */
    height?: number;

    /**
     * The presentation mode of the swap chain.
     * This determines how the swap chain presents the back buffer to the screen.
     * By default, `SurfacePresentMode.FIFO`.
     */
    desiredPresentationMode?: SurfacePresentMode;

    /**
     * The desired output color space.
     * Currently both swap chains present RGBA8_UNORM and ignore this: sRGB output is handled by the renderer's main render target
     * (its RGBA8_UNORM_SRGB view, plus the WebGL main render target pipeline's encoding), not by the swap chain.
     * By default, `OutputColorSpace.NONE`: no color management, values are written to the screen as-is.
     */
    desiredOutputColorSpace?: OutputColorSpace;
}
