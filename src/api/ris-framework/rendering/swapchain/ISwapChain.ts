import {TextureFormat} from "../texture/TextureFormat";
import {IDisposable} from "../../core/IDisposable";
import {vec2} from "gl-matrix";

/**
 * The interface for a swap chain, which is used to present the rendered image to the screen.
 */
export interface ISwapChain extends IDisposable {

    /**
     * The size of the back buffer.
     */
    readonly backBufferSize: vec2;

    /**
     * The texture format of the back buffer.
     */
    readonly textureFormat: TextureFormat;

    /**
     * Sets the back buffer size.
     * This is used to resize the back buffer when the window is resized.
     * @param width - The new width.
     * @param height - The new height.
     */
    resize(width: number, height: number): void;

    /**
     * Presents the back buffer to the screen.
     * This is called after rendering is done, and will swap the back buffer with the front buffer to display the rendered image on the screen.
     */
    present(): void;
}
