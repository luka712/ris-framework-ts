import {RawImageData} from "./RawImageData.ts";
import {vec2} from "gl-matrix";
/** The image processor. */
export interface IImageProcessor {

    /**
     * Resize the image to the given size.
     * @param image The image to resize.
     * @param size The new size.
     * @returns The resized image.
     */
    resizeAsync(image: RawImageData, size: vec2): Promise<RawImageData>;

    /**
     * Generate mipmaps levels for the image. Each level is half the previous one (at least 1x1) and is
     * downsampled from the previous level.
     * @param image The image to generate mipmaps for. Only its base level is used.
     * @param levels The number of mip levels to generate below the base level. 0 returns only the base level.
     * -1 (default) generates the full chain down to 1x1.
     * @returns The new image data with the base level followed by the generated mip levels.
     */
    generateMipmapsAsync(image: RawImageData, levels?: number): Promise<RawImageData>;

    /**
     * Get the bytes from an HTML image element.
     * @param image The image to get the bytes from.
     * @returns The bytes of the image.
     */
    getBytesFromHtmlImage(image: HTMLImageElement): Uint8ClampedArray<ArrayBuffer>;
}