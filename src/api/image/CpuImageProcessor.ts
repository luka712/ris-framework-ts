import { TextureUtilities } from "../_export.ts";
import type { IImageProcessor } from "./IImageProcessor.ts";
import { RawImageData } from "./RawImageData.ts";
import { vec2 } from "gl-matrix";

/**
 * The default CPU-based image processor.
 */
export class CpuImageProcessor implements IImageProcessor {

    /** @inheritdoc */
    public async resizeAsync(image: RawImageData, size: vec2): Promise<RawImageData> {
        const data = image.getData(0);

        if (data === undefined) {
            throw new Error("CpuImageProcessor.resizeAsync: Invalid image data (the base level has no data).");
        }

        const bytes = this._resizeBytes(data, [image.baseWidth, image.baseHeight], image.channels, size);
        return new RawImageData([bytes], Math.floor(size[0]), Math.floor(size[1]), image.channels);

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
    public async generateMipmapsAsync(imageData: RawImageData, levels = -1): Promise<RawImageData> {

        let data = imageData.getData(0);
        const resultData = [data];

        const baseSize = vec2.fromValues(imageData.baseWidth, imageData.baseHeight);
        const resize = vec2.create();


        // mipLevels counts the base level too; levels is the number of mips below the base.
        if (levels < 0) {
            levels = TextureUtilities.mipLevels(baseSize[0], baseSize[1]) - 1;
        }

        for (let i = 0; i < levels; i++) {

            resize[0] = Math.max(1, Math.floor(baseSize[0] / 2));
            resize[1] = Math.max(1, Math.floor(baseSize[1] / 2));

            data = this._resizeBytes(data, baseSize, imageData.channels, resize);
            vec2.copy(baseSize, resize);
            resultData.push(data);
        }


        return new RawImageData(resultData, imageData.baseWidth, imageData.baseHeight, imageData.channels);
    }

    /**
     * Resizes raw RGBA8 bytes by drawing them into a canvas and scaling it with high quality smoothing.
     * @param data The source bytes, `width * height * 4` long.
     * @param baseSize The source width and height.
     * @param channels The number of channels. Must be 4.
     * @param size The target width and height. Fractions are floored.
     * @returns The resized RGBA8 bytes.
     * @throws Error when the image does not have 4 channels or the byte length does not match width * height * 4.
     * @ai-generated
     */
    private _resizeBytes(data: number[] | ArrayBufferView, baseSize: vec2, channels: number,
        size: vec2): Uint8ClampedArray<ArrayBuffer> {

        const width = baseSize[0];
        const height = baseSize[1];

        if (channels != 4) {
            throw new Error(`CpuImageProcessor._resizeBytes: only 4 channel (RGBA) raw bytes can be resized; got ${channels} channels.`);
        }

        // Reads only, so an ArrayBuffer backed view is used without copying.
        const source = Array.isArray(data)
            ? Uint8ClampedArray.from(data)
            : data.buffer instanceof ArrayBuffer
                ? new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength)
                : Uint8ClampedArray.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));

        if (source.length != width * height * 4) {
            throw new Error(`CpuImageProcessor._resizeBytes: expected ${width * height * 4} bytes for ${width}x${height} RGBA; got ${source.length}.`);
        }

        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        sourceCanvas.getContext("2d")!.putImageData(new ImageData(source, width, height), 0, 0);

        const w = Math.floor(size[0]);
        const h = Math.floor(size[1]);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const context = canvas.getContext("2d")!;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(sourceCanvas, 0, 0, w, h);

        return context.getImageData(0, 0, w, h).data;
    }
}