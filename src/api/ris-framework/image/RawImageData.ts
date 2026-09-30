import {IDisposable} from "../core/IDisposable";

/**
 * The image data.
 */
export class RawImageData implements IDisposable {

    /**
     * The image data per mip level.
     */
    private _data?: Array<number[] | HTMLImageElement | ArrayBufferView>;

    /**
     * The constructor.
     * @param data The data.
     * @param baseWidth The image width.
     * @param baseHeight The image height.
     * @param channels The number of channels in the image.
     */
    public constructor(data: Array<number[] | HTMLImageElement | ArrayBufferView>,
                       public readonly baseWidth: number,
                       public readonly baseHeight: number,
                       public readonly channels: number) {

        this._data = data;
        this.numLevels = data.length;
    }

    /**
     * The number of mip levels.
     */
    public readonly numLevels : number;

    /**
     * Gets the image data for a specific mip level.
     * @param mipLevel - The mip level.
     * @returns The data.
     */
    public getData(mipLevel: number): number[] | HTMLImageElement | ArrayBufferView {
        return this._data![mipLevel];
    }

    /** @inheritDoc */
    public dispose(): void {
        this._data = undefined;
    }
}
