import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {vec2} from "gl-matrix";
import {KtxDFTransfer, VkFormat, type IKtx2Texture} from "ris-ktx2";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {TextureUsage} from "../src/api/rendering/texture/TextureUsage";
import {TextureUtilities} from "../src/api/rendering/texture/TextureUtilities";
import {ATextureFactory} from "../src/api/rendering/texture/ATextureFactory";
import type {ITextureDescriptor} from "../src/api/rendering/texture/ITextureDescriptor";
import type {ITexture2D} from "../src/api/rendering/texture/ITexture2D";
import type {ITexture2DArray} from "../src/api/rendering/texture/ITexture2DArray";
// WebGlUtilities first: importing WebGL texture code directly hits the WebGlUtilities import cycle.
import {WebGlUtilities} from "../src/webgl/utilities/WebGlUtilities";
import {WebGlTexture2DArray} from "../src/webgl/texture/WebGlTexture2DArray";
import {WebGpuTexture2DArray} from "../src/webgpu/texture/WebGpuTexture2DArray";

/** A WebGL2 context that records every call; constants are unique numbers. */
function recordingGl() {
    const calls: [string, unknown[]][] = [];
    const constants = new Map<string, number>();
    const gl = new Proxy({} as Record<string, unknown>, {
        get(_target, prop: string) {
            if (prop === "NO_ERROR") {
                return 0;
            }
            if (prop === "getError") {
                return () => 0;
            }
            if (/^[A-Z0-9_]+$/.test(prop)) {
                if (!constants.has(prop)) {
                    constants.set(prop, 1000 + constants.size);
                }
                return constants.get(prop);
            }
            return (...args: unknown[]) => {
                calls.push([prop, args]);
                return {glObject: prop};
            };
        },
    }) as unknown as WebGL2RenderingContext;
    const named = (name: string) => calls.filter(([n]) => n === name).map(([, args]) => args);
    return {gl, calls, named, constant: (name: string) => (gl as unknown as Record<string, number>)[name]};
}

/** `levels` BC7 mip levels of one layer; each level is whole 4x4 blocks of 16 bytes filled with `value`. */
function bc7Levels(width: number, height: number, levels: number, value: number): Uint8Array[] {
    const result: Uint8Array[] = [];
    for (let level = 0; level < levels; level++) {
        result.push(new Uint8Array(TextureUtilities.getVRamSize(TextureFormat.BC7_RGBA_UNORM, Math.max(1, width >> level), Math.max(1, height >> level))).fill(value));
    }
    return result;
}

const BLOCK_4X4 = vec2.fromValues(4, 4);

describe("WebGlTextureUtilities.createCompressedTexture2DArray", () => {
    it("allocates with texStorage3D and uploads each layer and level with compressedTexSubImage3D for block-aligned sizes", () => {
        const {gl, named, constant} = recordingGl();
        WebGlUtilities.texture.createCompressedTexture2DArray(gl, 8, 8, 2, BLOCK_4X4,
            [bc7Levels(8, 8, 2, 1), bc7Levels(8, 8, 2, 2)], TextureFormat.BC7_RGBA_UNORM, "bc7");

        const storage = named("texStorage3D");
        expect(storage).toHaveLength(1);
        expect(storage[0].slice(0, 2)).toEqual([constant("TEXTURE_2D_ARRAY"), 2]);
        expect(storage[0].slice(3)).toEqual([8, 8, 2]);

        const uploads = named("compressedTexSubImage3D").map(args => ({
            level: args[1], layer: args[4], width: args[5], height: args[6], depth: args[7], bytes: (args[9] as Uint8Array).byteLength,
        }));
        expect(uploads).toEqual([
            {level: 0, layer: 0, width: 8, height: 8, depth: 1, bytes: 64},
            {level: 1, layer: 0, width: 4, height: 4, depth: 1, bytes: 16},
            {level: 0, layer: 1, width: 8, height: 8, depth: 1, bytes: 64},
            {level: 1, layer: 1, width: 4, height: 4, depth: 1, bytes: 16},
        ]);
        expect(named("compressedTexImage3D")).toHaveLength(0);
    });

    it("uploads whole levels with compressedTexImage3D, zero-filling missing layers, when the size is not block-aligned", () => {
        const {gl, named, constant} = recordingGl();
        // 6x6 BC7 = 2x2 blocks (64 bytes) at level 0, 1 block (16 bytes) at level 1 (3x3).
        WebGlUtilities.texture.createCompressedTexture2DArray(gl, 6, 6, 3, BLOCK_4X4,
            [bc7Levels(6, 6, 2, 7)], TextureFormat.BC7_RGBA_UNORM, "unaligned");

        expect(named("texStorage3D")).toHaveLength(0);
        const levels = named("compressedTexImage3D");
        expect(levels.map(args => [args[1], args[3], args[4], args[5]])).toEqual([[0, 6, 6, 3], [1, 3, 3, 3]]);
        const level0 = levels[0][7] as Uint8Array;
        expect(level0.byteLength).toBe(64 * 3);
        expect(level0[0]).toBe(7);
        expect(level0[64]).toBe(0);
        expect(named("texParameteri")).toContainEqual([constant("TEXTURE_2D_ARRAY"), constant("TEXTURE_MAX_LEVEL"), 1]);
    });

    it("throws for PVRTC, uncompressed formats, too many layers and short levels before touching GL", () => {
        const {gl, calls} = recordingGl();
        const utilities = WebGlUtilities.texture;
        expect(() => utilities.createCompressedTexture2DArray(gl, 8, 8, 1, BLOCK_4X4, null, TextureFormat.PVRTC1_RGBA_4BPP_UNORM, "pvr"))
            .toThrow("WebGlTextureUtilities.createCompressedTexture2DArray: 'pvr' has format PVRTC1_RGBA_4BPP_UNORM; WebGL only supports PVRTC on TEXTURE_2D, not TEXTURE_2D_ARRAY.");
        expect(() => utilities.createCompressedTexture2DArray(gl, 8, 8, 1, BLOCK_4X4, null, TextureFormat.RGBA8_UNORM, "rgba"))
            .toThrow("'rgba' has uncompressed format RGBA8_UNORM; use createTexture2DArray instead.");
        expect(() => utilities.createCompressedTexture2DArray(gl, 8, 8, 1, BLOCK_4X4,
            [bc7Levels(8, 8, 1, 0), bc7Levels(8, 8, 1, 0)], TextureFormat.BC7_RGBA_UNORM, "layers"))
            .toThrow("'layers' has data for 2 layers, but the texture array has 1 layers.");
        expect(() => utilities.createCompressedTexture2DArray(gl, 8, 8, 1, BLOCK_4X4,
            [[new Uint8Array(63)]], TextureFormat.BC7_RGBA_UNORM, "short"))
            .toThrow("'short' layer 0 mip 0 has 63 bytes; 8x8 BC7_RGBA_UNORM needs 64 (whole 4x4 blocks).");
        expect(calls).toHaveLength(0);
    });
});

/** A framework with a WebGL device whose features support `supported`. */
function webGlFramework(supported: TextureFormat[]) {
    const recorder = recordingGl();
    const framework = {
        renderer: {
            graphicsDevice: {
                gl: recorder.gl, api: "WEB_GL",
                features: {supportsTextureView: false, supportsTextureFormat: (format: TextureFormat) => supported.includes(format)},
            },
        },
    } as any;
    return {framework, ...recorder};
}

describe("WebGlTexture2DArray compressed formats and mipmaps", () => {
    it("keeps a supported compressed format instead of throwing", () => {
        const {framework, named} = webGlFramework([TextureFormat.ETC2_RGBA8_UNORM]);
        const texture = new WebGlTexture2DArray(framework, {
            width: 4, height: 4, layers: 2,
            // 4x4 ETC2 RGBA = one 16-byte block.
            dataArray: [[new Uint8Array(16)], [new Uint8Array(16)]],
            textureFormat: TextureFormat.ETC2_RGBA8_UNORM,
            blockSize: BLOCK_4X4,
            label: "etc2",
        });
        texture.initialize();
        expect(named("compressedTexSubImage3D")).toHaveLength(2);
        expect(texture.vramSize).toBe(16 * 2);
        expect(texture.mipLevels).toBe(1);
    });

    it("throws when the device does not support the compressed format", () => {
        const {framework} = webGlFramework([]);
        const texture = new WebGlTexture2DArray(framework, {
            width: 4, height: 4, layers: 1, dataArray: [[new Uint8Array(16)]],
            textureFormat: TextureFormat.ASTC_4X4_UNORM, blockSize: BLOCK_4X4, label: "astc",
        });
        expect(() => texture.initialize()).toThrow("WebGlTexture2DArray.initialize: 'astc' has compressed format ASTC_4X4_UNORM, which this WebGL2 device does not support");
    });

    it("generates the full mip chain with generateMipmap for RGBA8", () => {
        const {framework, named, constant} = webGlFramework([]);
        const texture = new WebGlTexture2DArray(framework, {
            width: 4, height: 2, layers: 2,
            dataArray: [[new Uint8Array(32)], [new Uint8Array(32)]],
            textureFormat: TextureFormat.RGBA8_UNORM_SRGB,
            generateMipmaps: true,
        });
        texture.initialize();
        expect(named("texStorage3D")[0][1]).toBe(3);
        expect(named("generateMipmap")).toEqual([[constant("TEXTURE_2D_ARRAY")]]);
        expect(texture.mipLevels).toBe(3);
    });

    it("refuses mipmap generation for block-compressed formats", () => {
        const {framework} = webGlFramework([TextureFormat.BC7_RGBA_UNORM]);
        expect(() => new WebGlTexture2DArray(framework, {
            width: 4, height: 4, layers: 1, dataArray: [[new Uint8Array(16)]],
            textureFormat: TextureFormat.BC7_RGBA_UNORM, blockSize: BLOCK_4X4, generateMipmaps: true, label: "bc7mips",
        })).toThrow("ATexture2DArray: 'bc7mips' requests mipmap generation for block-compressed format BC7_RGBA_UNORM; mipmaps can't be generated on the GPU for compressed formats.");
    });
});

const GPU_TEXTURE_USAGE = {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16};

function webGpuFramework() {
    const pass = {setPipeline: vi.fn(), setBindGroup: vi.fn(), draw: vi.fn(), end: vi.fn()};
    const encoder = {beginRenderPass: vi.fn(() => pass), finish: vi.fn(() => ({commandBuffer: true}))};
    const createView = vi.fn((desc?: GPUTextureViewDescriptor) => ({viewDesc: desc}));
    const device = {
        createTexture: vi.fn((desc: GPUTextureDescriptor) => ({desc, createView, destroy: vi.fn()})),
        createShaderModule: vi.fn((desc: GPUShaderModuleDescriptor) => ({moduleDesc: desc})),
        createSampler: vi.fn((desc: GPUSamplerDescriptor) => ({samplerDesc: desc})),
        createBindGroupLayout: vi.fn((desc: GPUBindGroupLayoutDescriptor) => ({layoutDesc: desc})),
        createPipelineLayout: vi.fn((desc: GPUPipelineLayoutDescriptor) => ({pipelineLayoutDesc: desc})),
        createRenderPipeline: vi.fn((desc: GPURenderPipelineDescriptor) => ({pipelineDesc: desc})),
        createBindGroup: vi.fn((desc: GPUBindGroupDescriptor) => ({bindGroupDesc: desc})),
        createCommandEncoder: vi.fn(() => encoder),
        pushErrorScope: vi.fn(),
        popErrorScope: vi.fn(() => Promise.resolve(null)),
        queue: {writeTexture: vi.fn(), copyExternalImageToTexture: vi.fn(), submit: vi.fn()},
    };
    const framework = {
        renderer: {
            graphicsDevice: {device, api: "WEB_GPU", features: {supportsTextureView: true, supportsTextureFormat: () => true}},
            preferredTextureFormat: TextureFormat.RGBA8_UNORM,
        },
    } as any;
    return {framework, device, encoder, pass, createView};
}

describe("WebGpuTexture2DArray mipmap generation", () => {
    beforeEach(() => {
        vi.stubGlobal("GPUTextureUsage", GPU_TEXTURE_USAGE);
        vi.stubGlobal("GPUShaderStage", {VERTEX: 1, FRAGMENT: 2, COMPUTE: 4});
    });
    afterEach(() => vi.unstubAllGlobals());

    it("allocates the full chain and renders every level of every layer from the previous one", () => {
        const {framework, device, encoder, pass} = webGpuFramework();
        const texture = new WebGpuTexture2DArray(framework, {
            width: 4, height: 4, layers: 2,
            dataArray: [[new Uint8Array(64)], [new Uint8Array(64)]],
            textureFormat: TextureFormat.RGBA8_UNORM_SRGB,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST | TextureUsage.RENDER_ATTACHMENT,
            generateMipmaps: true,
            label: "mips",
        });
        texture.initialize();

        expect(device.createTexture.mock.calls[0][0].mipLevelCount).toBe(3);
        expect(texture.mipLevels).toBe(3);
        // Level 0 is uploaded; levels 1 and 2 are rendered for each of the 2 layers.
        expect(device.queue.writeTexture).toHaveBeenCalledTimes(2);
        expect(encoder.beginRenderPass).toHaveBeenCalledTimes(4);
        expect(pass.draw).toHaveBeenCalledWith(3);
        expect(device.queue.submit).toHaveBeenCalledOnce();
        expect(device.createRenderPipeline.mock.calls[0][0].fragment!.targets).toEqual([{format: "rgba8unorm-srgb"}]);

        // Layer 1, level 2 is drawn from layer 1, level 1.
        const lastBindGroup = device.createBindGroup.mock.calls[3][0];
        const source = (lastBindGroup.entries as GPUBindGroupEntry[])[0].resource as unknown as {viewDesc: GPUTextureViewDescriptor};
        expect(source.viewDesc).toMatchObject({dimension: "2d", baseMipLevel: 1, mipLevelCount: 1, baseArrayLayer: 1, arrayLayerCount: 1});
        const target = (encoder.beginRenderPass.mock.calls[3] as unknown as [GPURenderPassDescriptor])[0];
        const targetView = [...target.colorAttachments][0]!.view as unknown as {viewDesc: GPUTextureViewDescriptor};
        expect(targetView.viewDesc).toMatchObject({baseMipLevel: 2, baseArrayLayer: 1});

        // A second texture on the same device reuses the shader module and pipeline.
        new WebGpuTexture2DArray(framework, {
            width: 2, height: 2, layers: 1, dataArray: [[new Uint8Array(16)]],
            textureFormat: TextureFormat.RGBA8_UNORM_SRGB,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST | TextureUsage.RENDER_ATTACHMENT,
            generateMipmaps: true,
        }).initialize();
        expect(device.createShaderModule).toHaveBeenCalledOnce();
        expect(device.createRenderPipeline).toHaveBeenCalledOnce();
    });

    it("throws for formats that can't be rendered and filtered, before creating the texture", () => {
        const {framework, device} = webGpuFramework();
        const texture = new WebGpuTexture2DArray(framework, {
            width: 4, height: 4, layers: 1, dataArray: [[new Uint8Array(64)]],
            textureFormat: TextureFormat.R32_FLOAT,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST | TextureUsage.RENDER_ATTACHMENT,
            generateMipmaps: true, label: "r32",
        });
        expect(() => texture.initialize()).toThrow("WebGpuTexture2DArray.initialize: 'r32' requests mipmap generation for R32_FLOAT; mipmaps can only be generated for RGBA8_UNORM and RGBA8_UNORM_SRGB.");
        expect(device.createTexture).not.toHaveBeenCalled();
    });
});

/** Records the descriptors ATextureFactory builds, without a backend. */
class RecordingFactory extends ATextureFactory {
    public last: ITextureDescriptor | null = null;
    public constructor() {
        super({
            renderer: {preferredTextureFormat: TextureFormat.RGBA8_UNORM},
            graphicsDevice: {api: "test", features: {supportsTextureFormat: () => true}},
        } as never);
    }
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        this.last = descriptor;
        return {} as ITexture2D;
    }
    protected _createAndInitializeTexture2DArray(descriptor: ITextureDescriptor): ITexture2DArray {
        this.last = descriptor;
        return {} as ITexture2DArray;
    }
}

function ktx(vkFormat: VkFormat, numLevels: number, bytesPerLevel: (level: number) => number): IKtx2Texture {
    return {
        oetf: KtxDFTransfer.LINEAR, vkFormat, needsTranscoding: false,
        numLevels, width: 8, height: 8, filePath: "file.ktx2",
        getTextureFormatInfo: () => vkFormat == VkFormat.R8G8B8A8_UNORM ? {blockWidth: 1, blockHeight: 1} : {blockWidth: 4, blockHeight: 4},
        getImage: (level: number) => new Uint8Array(bytesPerLevel(level)),
    } as unknown as IKtx2Texture;
}

describe("ATextureFactory.createTexture2DArrayFromKtx2 mipmaps", () => {
    const rgba = (level: number) => (8 >> level) * (8 >> level) * 4;
    const bc7 = (level: number) => TextureUtilities.getVRamSize(TextureFormat.BC7_RGBA_UNORM, 8 >> level, 8 >> level);
    const renderable = TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST | TextureUsage.RENDER_ATTACHMENT;

    it("generates mipmaps for a single-level uncompressed file by default, with RENDER_ATTACHMENT usage", () => {
        const f = new RecordingFactory();
        f.createTexture2DArrayFromKtx2(ktx(VkFormat.R8G8B8A8_UNORM, 1, rgba), 2);
        expect(f.last!.generateMipmaps).toBe(true);
        expect(f.last!.textureUsage).toBe(renderable);

        f.createTexture2DArrayFromKtx2(ktx(VkFormat.R8G8B8A8_UNORM, 1, rgba), 2, undefined, null, undefined, false);
        expect(f.last!.generateMipmaps).toBe(false);
        expect(f.last!.textureUsage).toBe(TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST);
    });

    it("uses the stored levels of a multi-level file", () => {
        const f = new RecordingFactory();
        f.createTexture2DArrayFromKtx2(ktx(VkFormat.R8G8B8A8_UNORM, 4, rgba), 1, undefined, null, undefined, true);
        expect(f.last!.generateMipmaps).toBe(false);
        expect(f.last!.dataArray![0]).toHaveLength(4);
    });

    it("keeps one level for a single-level compressed file, and throws only when mipmaps are explicitly requested", () => {
        const f = new RecordingFactory();
        f.createTexture2DArrayFromKtx2(ktx(VkFormat.BC7_UNORM_BLOCK, 1, bc7), 1);
        expect(f.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_UNORM);
        expect(f.last!.generateMipmaps).toBe(false);

        expect(() => f.createTexture2DArrayFromKtx2(ktx(VkFormat.BC7_UNORM_BLOCK, 1, bc7), 1, undefined, null, "bc7.ktx2", true))
            .toThrow("ATextureFactory.createTexture2DArrayFromKtx2: 'bc7.ktx2' has 1 mip level in block-compressed format BC7_RGBA_UNORM; mipmaps can't be generated on the GPU for compressed formats.");
    });
});
