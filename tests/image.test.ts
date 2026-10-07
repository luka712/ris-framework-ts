import { beforeAll, describe, expect, it } from "vitest";
import { vec2 } from "gl-matrix";
import { CpuImageProcessor, RawImageData } from "../src/api/index.ts";

describe("RawImageData", () => {
    it("keeps one buffer per mip level", () => {
        const level0 = new Uint8Array([1, 2, 3, 4]);
        const level1 = new Uint8Array([5, 6, 7, 8]);
        const image = new RawImageData([level0, level1], 8, 4, 4);

        expect(image.baseWidth).toBe(8);
        expect(image.baseHeight).toBe(4);
        expect(image.channels).toBe(4);
        expect(image.numLevels).toBe(2);
        expect(image.getData(0)).toBe(level0);
        expect(image.getData(1)).toBe(level1);
        expect(image.getData(2)).toBeUndefined();
    });

    it("drops the mip buffers on dispose", () => {
        const image = new RawImageData([new Uint8Array([1])], 1, 1, 1);

        image.dispose();

        expect(() => image.getData(0)).toThrow(TypeError);
    });
});

describe("CpuImageProcessor", () => {
    beforeAll(() => {
        if (typeof globalThis.HTMLImageElement !== "function") {
            Object.defineProperty(globalThis, "HTMLImageElement", {
                configurable: true,
                writable: true,
                value: class HTMLImageElement {},
            });
        }
    });

    it("rejects a resize when the base level has no data", async () => {
        const processor = new CpuImageProcessor();
        const image = new RawImageData([undefined as unknown as number[]], 4, 4, 4);

        await expect(processor.resizeAsync(image, vec2.fromValues(2, 2)))
            .rejects.toThrow("Invalid image data");
    });

    it("does not resize raw byte buffers", async () => {
        const processor = new CpuImageProcessor();
        const image = new RawImageData([new Uint8Array([1, 2, 3, 4])], 1, 1, 4);

        await expect(processor.resizeAsync(image, vec2.fromValues(2, 2)))
            .rejects.toThrow("Not implemented.");
    });

    it("returns the base level when a 1x1 image has no smaller mip", async () => {
        const processor = new CpuImageProcessor();
        const pixels = new Uint8Array([9, 8, 7, 6]);
        const image = new RawImageData([pixels], 1, 1, 4);

        const result = await processor.generateMipmapsAsync(image);

        expect(result).not.toBe(image);
        expect(result.numLevels).toBe(1);
        expect(result.baseWidth).toBe(1);
        expect(result.baseHeight).toBe(1);
        expect(result.channels).toBe(4);
        expect(result.getData(0)).toBe(pixels);
    });

    it("returns the base level when asked for zero extra mips", async () => {
        const processor = new CpuImageProcessor();
        const pixels = new Uint8Array(8 * 8 * 4);
        const image = new RawImageData([pixels], 8, 8, 4);

        const result = await processor.generateMipmapsAsync(image, 0);

        expect(result.numLevels).toBe(1);
        expect(result.baseWidth).toBe(8);
        expect(result.baseHeight).toBe(8);
        expect(result.getData(0)).toBe(pixels);
    });

    it("does not build mip chains from raw byte buffers", async () => {
        const processor = new CpuImageProcessor();
        const image = new RawImageData([new Uint8Array(4 * 4 * 4)], 4, 4, 4);

        await expect(processor.generateMipmapsAsync(image)).rejects.toThrow("Not implemented.");
        await expect(processor.generateMipmapsAsync(image, 1)).rejects.toThrow("Not implemented.");
    });
});
