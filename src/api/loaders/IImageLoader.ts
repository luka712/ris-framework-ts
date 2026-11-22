import {RawImageData} from "../image/RawImageData.ts";

/**
 * The image loader interface.
 */
export interface IImageLoader {

    /**
     * Loads an image from a file.
     * @param path - The file path.
     * @param cache - Whether to cache the image in a persistent cache.
     * @returns The raw image data.
     */
    loadAsync(path: string, cache?: boolean): Promise<RawImageData>;

    /**
     * Disposes the temporary cache. Intended for framework use.
     */
    disposeOfTemporaryCache(): void;
}
