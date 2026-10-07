import {IImageLoader} from "./IImageLoader";
import {IFramework} from "../IFramework";
import {TextureFormat} from "../rendering/texture/TextureFormat";
import {RawImageData} from "../image/RawImageData";

/**
 * The image loader.
 *
 * Loads images through the browser Fetch API and converts them
 * into raw pixel data suitable for the rendering backend.
 */
export class ImageLoader implements IImageLoader {

    /**
     * A temporary cache is released when the engine clears it.
     * It exists only for the duration of a loading/initialization operation.
     */
    private readonly _tempCache: Record<string, RawImageData> = {};

    /**
     * Persistent cache is released only when the application
     * is closed or the cache is manually cleared.
     */
    private readonly _permanentCache: Record<string, RawImageData> = {};

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(
        private readonly _framework: IFramework,
    ) {
    }

    /**
     * Loads a PNG/JPEG/etc. image using fetch.
     */
    private async _loadImage(
        path: string,
        preferredTextureFormat: TextureFormat,
    ): Promise<RawImageData> {

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                resolve(new RawImageData([image], image.width, image.height, 4));
            };
            image.onerror = (e) => {
                console.error("failed to load", image.src, e);
                reject();
            }
            image.src = path;
        });
    }

    /** @inheritDoc */
    public async loadAsync(
        path: string,
        cache: boolean = false,
    ): Promise<RawImageData> {

        const selectedCache = cache
            ? this._permanentCache
            : this._tempCache;

        const cached = selectedCache[path];

        if (cached !== undefined) {
            return cached;
        }

        const imageData = await this._loadImage(
            path,
            this._framework.renderer.preferredTextureFormat,
        );

        selectedCache[path] = imageData;

        return imageData;
    }

    /** @inheritDoc */
    public disposeOfTemporaryCache(): void {
        for (const imageData of Object.values(this._tempCache)) {
            imageData.dispose();
        }

        Object.keys(this._tempCache).forEach(
            key => delete this._tempCache[key],
        );
    }
}