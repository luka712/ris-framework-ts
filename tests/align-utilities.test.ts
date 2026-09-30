import { describe, expect, it } from "vitest";
import { AlignUtilities } from "../src/index.ts";

describe("AlignUtilities", () => {
    it("rounds a value up to a power-of-two alignment", () => {
        expect(AlignUtilities.align(0, 4)).toBe(0);
        expect(AlignUtilities.align(1, 4)).toBe(4);
        expect(AlignUtilities.align(4, 4)).toBe(4);
        expect(AlignUtilities.align(5, 8)).toBe(8);
        expect(AlignUtilities.align(8, 8)).toBe(8);
        expect(AlignUtilities.align(13, 8)).toBe(16);
        expect(AlignUtilities.align(1, 256)).toBe(256);
        expect(AlignUtilities.align(256, 256)).toBe(256);
        expect(AlignUtilities.align(257, 256)).toBe(512);
    });

    it("returns the same array when its length is already aligned", () => {
        const values = new Float32Array([1, 2, 3, 4]);

        expect(AlignUtilities.alignArray(values, 4)).toBe(values);
        expect(AlignUtilities.alignArray([1, 2, 3, 4], 2)).toEqual([1, 2, 3, 4]);
    });

    it("pads a short array up to the aligned length", () => {
        const values = new Float32Array([1, 2, 3]);
        const aligned = AlignUtilities.alignArray(values, 4);

        expect(aligned).not.toBe(values);
        expect(Array.isArray(aligned)).toBe(true);
        expect(aligned.length).toBe(4);
        expect(aligned[0]).toBe(1);
        expect(aligned[1]).toBe(2);
        expect(aligned[2]).toBe(3);
        expect(aligned[3]).toBeUndefined();
    });
});
