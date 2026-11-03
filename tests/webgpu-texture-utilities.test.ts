import {describe, expect, it, vi} from "vitest";
import {WebGpuTextureUtilities} from "../src/webgpu/utilities/WebGpuTextureUtilities";

describe("WebGpuTextureUtilities compressed sizes", () => {
    const utilities = new WebGpuTextureUtilities();

    it("aligns the base size to the block size", () => {
        expect(utilities.alignSizeToBlock(768, 512, 10, 5)).toEqual([770, 515]);
        expect(utilities.alignSizeToBlock(768, 512, 4, 4)).toEqual([768, 512]);
        expect(utilities.alignSizeToBlock(1, 1, 4, 4)).toEqual([4, 4]);
    });

    it("writes whole blocks with block-based row pitch", () => {
        const queue = {writeTexture: vi.fn()};
        const texture = {} as GPUTexture;
        utilities.writeCompressedToTexture(queue as unknown as GPUQueue, texture, new Uint8Array(16), 768, 512, 10, 5, 16, 0);
        const [, , layout, size] = queue.writeTexture.mock.calls[0];
        expect(layout).toMatchObject({bytesPerRow: 77 * 16, rowsPerImage: 103});
        expect(size).toMatchObject({width: 770, height: 515});
    });

    it("keeps mip copies inside the physical mip of the aligned texture", () => {
        // Logical 768x512 ASTC 10x5 -> physical base 770x515.
        const [pw, ph] = utilities.alignSizeToBlock(768, 512, 10, 5);
        let w = 768, h = 512, gw = pw, gh = ph;
        for (let level = 0; level < 10; level++) {
            const copyW = Math.ceil(w / 10) * 10, copyH = Math.ceil(h / 5) * 5;
            const physW = Math.ceil(gw / 10) * 10, physH = Math.ceil(gh / 5) * 5;
            expect(copyW).toBeLessThanOrEqual(physW);
            expect(copyH).toBeLessThanOrEqual(physH);
            w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
            gw = Math.max(1, gw >> 1); gh = Math.max(1, gh >> 1);
        }
    });
});
