import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {WebGpuTexture2D} from "../src/webgpu/texture/WebGpuTexture2D";
import {WebGpuInspectTextureMipsRenderPipeline} from "../src/webgpu/render-pipelines/inspect/WebGpuInspectTextureMipsRenderPipeline";
import {WebGpuRenderPipelineFactory} from "../src/webgpu/render-pipelines/WebGpuRenderPipelineFactory";
import {WebGpuTextureFactory} from "../src/webgpu/texture/WebGpuTextureFactory";

function createFramework() {
    const encoder = {
        setPipeline: vi.fn(), setVertexBuffer: vi.fn(), setIndexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn(),
    };
    const createView = vi.fn((desc?: GPUTextureViewDescriptor) => ({viewDesc: desc}));
    const device = {
        createTexture: vi.fn((desc: GPUTextureDescriptor) => ({desc, createView, destroy: vi.fn()})),
        createBindGroupLayout: vi.fn((desc: GPUBindGroupLayoutDescriptor) => ({layoutDesc: desc})),
        createBindGroup: vi.fn((desc: GPUBindGroupDescriptor) => ({bindGroupDesc: desc})),
        createPipelineLayout: vi.fn((desc: GPUPipelineLayoutDescriptor) => ({pipelineLayoutDesc: desc})),
        createRenderPipeline: vi.fn((desc: GPURenderPipelineDescriptor) => ({pipelineDesc: desc})),
        pushErrorScope: vi.fn(),
        popErrorScope: vi.fn(() => Promise.resolve(null)),
        queue: {writeTexture: vi.fn(), copyExternalImageToTexture: vi.fn()},
    };
    const graphicsDevice = {
        device, api: "WEB_GPU",
        features: {supportsTextureView: true},
        defaultBlendState: {gpuBlendState: undefined},
        defaultTextureSampler: {id: 7, gpuSampler: {sampler: "default"}},
        defaultPrimitiveState: {gpuPrimitiveState: {topology: "triangle-list"}},
        renderPassEncoder: encoder,
    };
    const loadShaderModule = vi.fn(() => ({gpuShaderModule: {module: "inspect_texture_mips"}}));
    const framework = {
        renderer: {
            graphicsDevice,
            preferredTextureFormat: TextureFormat.RGBA8_UNORM,
            preferredDepthStencilFormat: TextureFormat.DEPTH24_PLUS_STENCIL8,
        },
        content: {loadShaderModule},
    } as any;
    framework.textureFactory = new WebGpuTextureFactory(framework);
    return {framework, device, encoder, loadShaderModule};
}

const uniform = (name: string) => ({gpuBuffer: {name, size: 64}}) as any;

describe("WebGpuInspectTextureMipsRenderPipeline", () => {
    beforeEach(() => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        vi.stubGlobal("GPUShaderStage", {VERTEX: 1, FRAGMENT: 2, COMPUTE: 4});
    });
    afterEach(() => vi.unstubAllGlobals());

    it("is created by the WebGPU pipeline factory with a 2d texture binding", () => {
        const {framework, device, loadShaderModule} = createFramework();
        const pipeline = new WebGpuRenderPipelineFactory(framework)
            .createInspectTextureMipsRenderPipeline(uniform("pv"), uniform("model"), uniform("fragment"));

        expect(pipeline).toBeInstanceOf(WebGpuInspectTextureMipsRenderPipeline);
        expect(loadShaderModule).toHaveBeenCalledWith("inspect_texture_mips");

        const layouts = device.createBindGroupLayout.mock.calls.map(([desc]) => [...desc.entries]);
        expect(layouts).toHaveLength(3);
        expect(layouts[1][0]).toMatchObject({binding: 0, texture: {sampleType: "float", viewDimension: "2d"}});
        expect(layouts[2][0]).toMatchObject({binding: 2, buffer: {type: "uniform"}});

        const pipelineDesc = device.createRenderPipeline.mock.calls[0][0];
        expect([...pipelineDesc.fragment!.targets][0]).toMatchObject({format: "rgba8unorm"});
        expect(pipelineDesc.depthStencil).toMatchObject({format: "depth24plus-stencil8"});
    });

    it("binds camera, texture (default when unset) and fragment data groups, then draws", () => {
        const {framework, device, encoder} = createFramework();
        const pipeline = new WebGpuInspectTextureMipsRenderPipeline(framework, uniform("pv"), uniform("model"), uniform("fragment"));
        pipeline.initialize();

        const vb = {gpuBuffer: {name: "vb"}, byteSize: 36 * 4} as any;
        const ib = {gpuBuffer: {name: "ib"}, gpuIndexFormat: "uint16", paddedByteSize: 12, indicesCount: 6} as any;
        pipeline.render(vb, ib);

        expect(encoder.setBindGroup.mock.calls.map(([group]) => group)).toEqual([0, 1, 2]);
        expect(encoder.drawIndexed).toHaveBeenCalledWith(6, 1, 0);
        expect(pipeline.texture).toBe((framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2D());

        // The texture group binds the default texture's 2d view.
        const textureGroup = device.createBindGroup.mock.calls.find(([desc]) => String(desc.label).includes("texture group"))![0];
        const view = (textureGroup.entries as GPUBindGroupEntry[])[0].resource as any;
        expect(view.viewDesc.dimension).toBe("2d");

        // Bind groups are cached between draws.
        const created = device.createBindGroup.mock.calls.length;
        pipeline.render(vb, ib);
        expect(device.createBindGroup.mock.calls.length).toBe(created);
    });

    it("requires a model buffer", () => {
        const {framework} = createFramework();
        expect(() => new WebGpuInspectTextureMipsRenderPipeline(framework, uniform("pv"), undefined as any, uniform("fragment")))
            .toThrow(/WebGpuInspectTextureMipsRenderPipeline: modelBuffer is required/);
    });
});

describe("ATextureFactory.createWithMipLevels (WebGPU)", () => {
    beforeEach(() => vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16}));
    afterEach(() => vi.unstubAllGlobals());

    const levels = (size: number, count: number) =>
        Array.from({length: count}, (_, level) => new Uint8Array(Math.max(1, size >> level) ** 2 * 4).fill(level));

    it("creates a texture with one GPU mip level per given level and uploads each at its own size", () => {
        const {framework, device} = createFramework();
        const texture = new WebGpuTextureFactory(framework).createWithMipLevels(4, 4, levels(4, 3), "mips");

        expect(texture).toBeInstanceOf(WebGpuTexture2D);
        expect(texture.mipLevels).toBe(3);
        expect(device.createTexture.mock.calls[0][0]).toMatchObject({mipLevelCount: 3, format: "rgba8unorm"});
        const uploads = device.queue.writeTexture.mock.calls.map(([dest, data, , size]: any[]) => [dest.mipLevel, data[0], size.width, size.height]);
        expect(uploads).toEqual([[0, 0, 4, 4], [1, 1, 2, 2], [2, 2, 1, 1]]);
    });

    it("rejects empty or too long mip chains and short levels", () => {
        const {framework} = createFramework();
        const factory = new WebGpuTextureFactory(framework);
        expect(() => factory.createWithMipLevels(4, 4, [], "none")).toThrow(/createWithMipLevels: 'none' has 0 mip levels; a 4x4 texture needs between 1 and 3/);
        expect(() => factory.createWithMipLevels(4, 4, levels(4, 4), "long")).toThrow(/has 4 mip levels/);
        expect(() => factory.createWithMipLevels(4, 4, [new Uint8Array(64), new Uint8Array(4)], "short"))
            .toThrow(/createWithMipLevels: 'short' mip 1 has 4 bytes of data/);
    });
});
