import {RawImageData} from "./RawImageData";
import {vec2} from "gl-matrix";
/** The image processor. */
export interface IImageProcessor {

    /**
     * Resize the image to the given size.
     * @param image The image to resize.
     * @param vec2 The new size.
     * @returns The resized image.
     */
    resizeAsync(image: RawImageData, vec2: vec2): Promise<RawImageData>;

    /**
     * Generate mipmaps levels for the image.
     * @param image The image to generate mipmaps for.
     * @param levels The number of mip levels to generate. -1 for automatic.
     * @returns The new image data with mipmaps.
     */
    generateMipmapsAsync(image: RawImageData, levels?: number): Promise<RawImageData>;

    /**
     * Get the bytes from an HTML image element.
     * @param image The image to get the bytes from.
     * @returns The bytes of the image.
     */
    getBytesFromHtmlImage(image: HTMLImageElement): Uint8ClampedArray<ArrayBuffer>;
}