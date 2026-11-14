import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {vec2} from "gl-matrix";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {TextureUsage} from "../src/api/rendering/texture/TextureUsage";
import {TextureViewDimension} from "../src/api/rendering/texture/TextureViewDimension";
import {WgslShaderModuleContent} from "../src/api/content/ShaderModuleContent";
import {WebGpuTexture2DArray} from "../src/webgpu/texture/WebGpuTexture2DArray";
import {WebGpuTextureFactory} from "../src/webgpu/texture/WebGpuTextureFactory";
import {WebGpuBindGroupLayoutEntryUtilities} from "../src/webgpu/utilities/WebGpuBindGroupLayoutEntryUtilities";

const GPU_TEXTURE_USAGE = {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16};

function createFramework() {
    const createView = vi.fn((desc?: GPUTextureViewDescriptor) => ({viewDesc: desc}));
    const destroy = vi.fn();
    const createTexture = vi.fn((desc: GPUTextureDescriptor) => ({desc, createView, destroy}));
    const writeTexture = vi.fn();
    const device = {
        createTexture,
        pushErrorScope: vi.fn(),
        popErrorScope: vi.fn(() => Promise.resolve(null)),
        queue: {writeTexture, copyExternalImageToTexture: vi.fn()},
    };
    const framework = {
        renderer: {
            graphicsDevice: {device, api: "WEB_GPU", features: {supportsTextureView: true, supportsTextureFormat: () => true}},
            preferredTextureFormat: TextureFormat.RGBA8_UNORM,
        },
    } as any;
    framework.graphicsDevice = framework.renderer.graphicsDevice;
    return {framework, createTexture, createView, destroy, writeTexture};
}

/** One mip chain of RGBA8 bytes for a layer, filled with `value`. */
function rgbaLevels(width: number, height: number, levels: number, value: number): Uint8Array[] {
    const result: Uint8Array[] = [];
    for (let level = 0; level < levels; level++) {
        result.push(new Uint8Array(Math.max(1, width >> level) * Math.max(1, height >> level) * 4).fill(value));
    }
    return result;
}

describe("WebGpuTexture2DArray", () => {
    beforeEach(() => vi.stubGlobal("GPUTextureUsage", GPU_TEXTURE_USAGE));
    afterEach(() => vi.unstubAllGlobals());

    it("creates a 2d texture with one array layer per layer and uploads every layer and mip level at origin.z = layer", () => {
        const {framework, createTexture, writeTexture} = createFramework();
        const texture = new WebGpuTexture2DArray(framework, {
            width: 4, height: 2, layers: 3,
            dataArray: [rgbaLevels(4, 2, 2, 1), rgbaLevels(4, 2, 2, 2), rgbaLevels(4, 2, 2, 3)],
            textureFormat: TextureFormat.RGBA8_UNORM,
            label: "layers",
        });
        texture.initialize();

        const desc = createTexture.mock.calls[0][0];
        expect(desc.size).toEqual({width: 4, height: 2, depthOrArrayLayers: 3});
        expect(desc.dimension).toBe("2d");
        expect(desc.mipLevelCount).toBe(2);
        expect(desc.format).toBe("rgba8unorm");
        // Default usage TEXTURE_BINDING | COPY_DST, used as-is.
        expect(desc.usage).toBe(GPU_TEXTURE_USAGE.TEXTURE_BINDING | GPU_TEXTURE_USAGE.COPY_DST);

        expect(writeTexture).toHaveBeenCalledTimes(6);
        const calls = writeTexture.mock.calls.map(([dest, data, layout, size]) => ({
            mipLevel: dest.mipLevel, z: dest.origin.z, first: data[0], bytesPerRow: layout.bytesPerRow, width: size.width, height: size.height,
        }));
        expect(calls).toEqual([
            {mipLevel: 0, z: 0, first: 1, bytesPerRow: 16, width: 4, height: 2},
            {mipLevel: 1, z: 0, first: 1, bytesPerRow: 8, width: 2, height: 1},
            {mipLevel: 0, z: 1, first: 2, bytesPerRow: 16, width: 4, height: 2},
            {mipLevel: 1, z: 1, first: 2, bytesPerRow: 8, width: 2, height: 1},
            {mipLevel: 0, z: 2, first: 3, bytesPerRow: 16, width: 4, height: 2},
            {mipLevel: 1, z: 2, first: 3, bytesPerRow: 8, width: 2, height: 1},
        ]);

        expect(Array.from(texture.size)).toEqual([4, 2, 3]);
        // (4*2 + 2*1) * 4 bytes * 3 layers.
        expect(texture.vramSize).toBe((8 + 2) * 4 * 3);
    });

    it("creates cached 2d-array views, also in an extra view format", () => {
        const {framework, createView} = createFramework();
        const texture = new WebGpuTexture2DArray(framework, {
            width: 1, height: 1, layers: 2,
            textureFormat: TextureFormat.RGBA8_UNORM,
            viewFormats: [TextureFormat.RGBA8_UNORM_SRGB],
        });
        texture.initialize();

        const view = texture.defaultTextureView;
        expect(view.dimension).toBe(TextureViewDimension.DIMENSION2DARRAY);
        expect(createView).toHaveBeenLastCalledWith(expect.objectContaining({format: "rgba8unorm", dimension: "2d-array"}));
        expect(texture.gpuDefaultView).toBe(view.nativeObject);
        expect(texture.defaultTextureView).toBe(view);

        texture.getTextureView(TextureFormat.RGBA8_UNORM_SRGB);
        expect(createView).toHaveBeenLastCalledWith(expect.objectContaining({format: "rgba8unorm-srgb", dimension: "2d-array"}));
        expect(createView).toHaveBeenCalledTimes(2);
    });

    it("uploads block-compressed layers with a block-aligned size and block-based rows", () => {
        const {framework, createTexture, writeTexture} = createFramework();
        const texture = new WebGpuTexture2DArray(framework, {
            width: 6, height: 6, layers: 2,
            // 6x6 BC7 = 2x2 blocks of 16 bytes.
            dataArray: [[new Uint8Array(64)], [new Uint8Array(64)]],
            textureFormat: TextureFormat.BC7_RGBA_UNORM,
            blockSize: vec2.fromValues(4, 4),
        });
        texture.initialize();

        expect(createTexture.mock.calls[0][0].size).toEqual({width: 8, height: 8, depthOrArrayLayers: 2});
        expect(writeTexture).toHaveBeenCalledTimes(2);
        const [dest, , layout, size] = writeTexture.mock.calls[1];
        expect(dest).toMatchObject({mipLevel: 0, origin: {z: 1}});
        expect(layout).toMatchObject({bytesPerRow: 2 * 16, rowsPerImage: 2});
        expect(size).toMatchObject({width: 8, height: 8});
    });

    it("throws with a clear message when there is data but no COPY_DST, or mipmap generation lacks RENDER_ATTACHMENT", () => {
        const {framework} = createFramework();
        const noCopyDst = new WebGpuTexture2DArray(framework, {
            width: 1, height: 1, dataArray: [[new Uint8Array(4)]],
            textureFormat: TextureFormat.RGBA8_UNORM,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_SRC,
            label: "NoCopyDst",
        });
        expect(() => noCopyDst.initialize()).toThrow(/WebGpuTexture2DArray\.initialize: 'NoCopyDst'.*COPY_DST/);

        const mips = new WebGpuTexture2DArray(framework, {
            width: 2, height: 2, dataArray: [[new Uint8Array(16)]],
            textureFormat: TextureFormat.RGBA8_UNORM,
            generateMipmaps: true,
        });
        expect(() => mips.initialize()).toThrow(/requests mipmap generation, which renders each level and needs TextureUsage\.TEXTURE_BINDING \| RENDER_ATTACHMENT/);
    });

    it("destroys the GPU texture and raises the disposed listeners once", () => {
        const {framework, destroy} = createFramework();
        const texture = new WebGpuTexture2DArray(framework, {width: 1, height: 1, layers: 1, textureFormat: TextureFormat.RGBA8_UNORM});
        texture.initialize();
        const listener = vi.fn();
        texture.addOnDisposedListener(listener);
        texture.dispose();
        texture.dispose();
        expect(destroy).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledExactlyOnceWith(texture);
        expect(() => texture.gpuTexture).toThrow(/WebGpuTexture2DArray\.gpuTexture/);
    });
});

describe("WebGpuTextureFactory.createTexture2DArray", () => {
    beforeEach(() => vi.stubGlobal("GPUTextureUsage", GPU_TEXTURE_USAGE));
    afterEach(() => vi.unstubAllGlobals());

    it("creates and initializes a WebGPU texture array instead of throwing", () => {
        const {framework, createTexture} = createFramework();
        const texture = new WebGpuTextureFactory(framework).createTexture2DArray(2, 2, 2,
            [rgbaLevels(2, 2, 1, 10), rgbaLevels(2, 2, 1, 20)], "factory");
        expect(texture).toBeInstanceOf(WebGpuTexture2DArray);
        expect(texture.size[2]).toBe(2);
        expect(createTexture.mock.calls[0][0].size).toEqual({width: 2, height: 2, depthOrArrayLayers: 2});
    });

    it("still validates the layer count", () => {
        const {framework} = createFramework();
        expect(() => new WebGpuTextureFactory(framework).createTexture2DArray(1, 1, 1,
            [rgbaLevels(1, 1, 1, 0), rgbaLevels(1, 1, 1, 0)], "tooMany")).toThrow(/data for 2 layers, but the texture array has 1/);
    });
});

describe("WebGPU inspect texture array shader and layout", () => {
    it("registers a WGSL inspect_texture_array program sampling a texture_2d_array", () => {
        const shader = WgslShaderModuleContent["inspect_texture_array"]?.shader ?? "";
        expect(shader).toContain("texture_2d_array<f32>");
        expect(shader).toContain("textureSampleLevel(textureArray, textureSampler, input.texCoord, layer, fragmentData.mipLevel)");
        expect(shader).toContain("fn main_vs");
        expect(shader).toContain("fn main_fs");
    });

    it("texture bind group layout entries default to a 2d view and accept 2d-array", () => {
        const entries = new WebGpuBindGroupLayoutEntryUtilities();
        expect(entries.createTextureBindGroupLayoutEntry(0, 2).texture).toEqual({sampleType: "float", viewDimension: "2d"});
        expect(entries.createTextureBindGroupLayoutEntry(0, 2, "float", "2d-array").texture).toEqual({sampleType: "float", viewDimension: "2d-array"});
    });
});
