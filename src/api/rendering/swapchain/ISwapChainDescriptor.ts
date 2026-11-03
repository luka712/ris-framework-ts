import { ColorSpace } from "../enums.ts";
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
     * The desired color space.
     * By default, `ColorSpace.LINEAR`.
     */
    desiredColorSpace?: ColorSpace;
}
