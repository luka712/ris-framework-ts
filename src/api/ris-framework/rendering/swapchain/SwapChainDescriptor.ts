/**
 * The description of a swap chain, which is used to create a swap chain for the graphics device.
 */
import {SurfacePresentMode} from "./SurfacePresentMode";

export class SwapChainDescriptor {

    /**
     * The width of the back buffer.
     */
    public width: number = 0;

    /**
     * The height of the back buffer.
     */
    public height: number = 0;

    /**
     * The presentation mode of the swap chain.
     * This determines how the swap chain presents the back buffer to the screen.
     */
    public desiredPresentationMode: SurfacePresentMode = SurfacePresentMode.FIFO;
}
