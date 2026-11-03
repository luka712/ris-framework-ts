import {afterEach, describe, expect, it, vi} from "vitest";
import {vec2} from "gl-matrix";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {WebGpuTexture2D} from "../src/webgpu/texture/WebGpuTexture2D";

function createFramework() {
    const createTexture = vi.fn((desc: GPUTextureDescriptor) => ({desc, createView: () => ({}), destroy: () => {}}));
    const device = {
        createTexture,
        pushErrorScope: vi.fn(),
        popErrorScope: vi.fn(() => Promise.resolve(null)),
        queue: {writeTexture: vi.fn(), copyExternalImageToTexture: vi.fn()},
    };
    const framework = {renderer: {graphicsDevice: {device}}} as any;
    return {framework, device, createTexture};
}

describe("WebGpuTexture2D native size", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("keeps the logical size and stores the block-aligned GPU size as native size", () => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        const {framework, createTexture} = createFramework();
        const texture = new WebGpuTexture2D(framework, {
            width: 768, height: 512,
            textureFormat: TextureFormat.ASTC_10X5_RGBA_UNORM,
            blockSize: vec2.fromValues(10, 5),
            data: [new Uint8Array(77 * 103 * 16)],
        });
        texture.initialize();

        expect(Array.from(texture.size)).toEqual([768, 512]);
        expect(Array.from(texture.nativeSize)).toEqual([770, 515]);
        expect(createTexture.mock.calls[0][0].size).toMatchObject({width: 770, height: 515});
    });

    it("uses the logical size as native size for uncompressed formats", () => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        const {framework} = createFramework();
        const texture = new WebGpuTexture2D(framework, {
            width: 3, height: 2,
            textureFormat: TextureFormat.RGBA_8_UNORM,
            data: [new Uint8Array(3 * 2 * 4)],
        });
        texture.initialize();

        expect(Array.from(texture.size)).toEqual([3, 2]);
        expect(Array.from(texture.nativeSize)).toEqual([3, 2]);
    });
});
