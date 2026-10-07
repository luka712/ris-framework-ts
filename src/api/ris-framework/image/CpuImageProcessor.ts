import {IImageProcessor} from "./IImageProcessor";
import {RawImageData} from "./RawImageData";
import {vec2} from "gl-matrix";

/**
 * The default CPU-based image processor.
 */
export class CpuImageProcessor implements IImageProcessor {

    /** @inheritdoc */
    public async resizeAsync(image: RawImageData, vec2: vec2): Promise<RawImageData> {
        const data = image.getData(0);

        if (data === undefined) {
            throw new Error("Invalid image data");
        }

        if (data instanceof HTMLImageElement) {
            const htmlImage = await this._resizeHTMLImageAsync(data, vec2);
            return new RawImageData([htmlImage], htmlImage.width, htmlImage.height, image.channels);
        } else {
            throw new Error("Not implemented.");
        }
    }

    /** @inheritdoc */
    public getBytesFromHtmlImage(image: HTMLImageElement): Uint8ClampedArray<ArrayBuffer> {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
        );

        return imageData.data;
    }

    /** @inheritdoc */
    public async generateMipmapsAsync(image: RawImageData, levels = -1): Promise<RawImageData> {

        const data = image.getData(0);
        const resultData = [data];

        const resize = vec2.create();
        let w = image.baseWidth;
        let h = image.baseHeight;

        if (levels < 0) {

            while (w > 1 && h > 1) {
                w = Math.floor(w / 2);
                h = Math.floor(h / 2);

                resize[0] = w;
                resize[1] = h;

                if (data instanceof HTMLImageElement) {
                    const htmlImage = await this._resizeHTMLImageAsync(data, resize);
                    resultData.push(htmlImage);
                } else {
                    throw new Error("Not implemented.");
                }
            }
        } else {
            for(let i = 0; i < levels; i++) {

                w = Math.floor(w / 2);
                h = Math.floor(h / 2);

                resize[0] = w;
                resize[1] = h;

                if (data instanceof HTMLImageElement) {
                    const htmlImage = await this._resizeHTMLImageAsync(data, resize);
                    resultData.push(htmlImage);
                } else {
                    throw new Error("Not implemented.");
                }
            }
        }

        return new RawImageData(resultData, image.baseWidth, image.baseHeight, image.channels);
    }

    private async _resizeHTMLImageAsync(image: HTMLImageElement, vec2: vec2): Promise<HTMLImageElement> {

        const w = Math.floor(vec2[0]);
        const h = Math.floor(vec2[1]);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const context = canvas.getContext("2d")!;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, w, h);

        const pixels = context.getImageData(0, 0, w, h);

        const resizedImage = new Image();
        resizedImage.width = w;
        resizedImage.height = h;
        resizedImage.src = canvas.toDataURL("image/png");

        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            resizedImage.onload = () => {
                resolve(resizedImage);
            };
            resizedImage.onerror = () => {
                reject(new Error("Failed to load resized image."));
            };
        });

        return promise;
    }
}