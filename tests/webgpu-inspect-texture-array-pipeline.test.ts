import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {WebGpuInspectTextureArrayRenderPipeline} from "../src/webgpu/render-pipelines/inspect/WebGpuInspectTextureArrayRenderPipeline";
import {WebGpuRenderPipelineFactory} from "../src/webgpu/render-pipelines/WebGpuRenderPipelineFactory";
import { WebGpuTextureFactory } from "../src/webgpu/texture/WebGpuTextureFactory.ts";

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
    const loadShaderModule = vi.fn(() => ({gpuShaderModule: {module: "inspect_texture_array"}}));
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

describe("WebGpuInspectTextureArrayRenderPipeline", () => {
    beforeEach(() => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        vi.stubGlobal("GPUShaderStage", {VERTEX: 1, FRAGMENT: 2, COMPUTE: 4});
    });
    afterEach(() => vi.unstubAllGlobals());

    it("is created by the WebGPU pipeline factory with a 2d-array texture binding", () => {
        const {framework, device, loadShaderModule} = createFramework();
        const pipeline = new WebGpuRenderPipelineFactory(framework)
            .createInspectTextureArrayRenderPipeline(uniform("pv"), uniform("model"), uniform("fragment"));

        expect(pipeline).toBeInstanceOf(WebGpuInspectTextureArrayRenderPipeline);
        expect(loadShaderModule).toHaveBeenCalledWith("inspect_texture_array");

        const layouts = device.createBindGroupLayout.mock.calls.map(([desc]) => [...desc.entries]);
        expect(layouts).toHaveLength(3);
        expect(layouts[1][0]).toMatchObject({binding: 0, texture: {sampleType: "float", viewDimension: "2d-array"}});
        expect(layouts[2][0]).toMatchObject({binding: 2, buffer: {type: "uniform"}});

        const pipelineDesc = device.createRenderPipeline.mock.calls[0][0];
        expect([...pipelineDesc.fragment!.targets][0]).toMatchObject({format: "rgba8unorm"});
        expect(pipelineDesc.depthStencil).toMatchObject({format: "depth24plus-stencil8"});
    });

    it("binds camera, texture array (default when unset) and fragment data groups, then draws", () => {
        const {framework, device, encoder} = createFramework();
        const pipeline = new WebGpuInspectTextureArrayRenderPipeline(framework, uniform("pv"), uniform("model"), uniform("fragment"));
        pipeline.initialize();

        const vb = {gpuBuffer: {name: "vb"}, byteSize: 36 * 4} as any;
        const ib = {gpuBuffer: {name: "ib"}, gpuIndexFormat: "uint16", paddedByteSize: 12, indicesCount: 6} as any;
        pipeline.render(vb, ib);

        expect(encoder.setBindGroup.mock.calls.map(([group]) => group)).toEqual([0, 1, 2]);
        expect(encoder.drawIndexed).toHaveBeenCalledWith(6, 1, 0);
        expect(pipeline.texture).toBe((framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2DArray());

        // The texture group binds the default texture array's 2d-array view.
        const textureGroup = device.createBindGroup.mock.calls.find(([desc]) => String(desc.label).includes("texture group"))![0];
        const view = (textureGroup.entries as GPUBindGroupEntry[])[0].resource as any;
        expect(view.viewDesc.dimension).toBe("2d-array");

        // Bind groups are cached between draws.
        const created = device.createBindGroup.mock.calls.length;
        pipeline.render(vb, ib);
        expect(device.createBindGroup.mock.calls.length).toBe(created);
    });

    it("requires a model buffer", () => {
        const {framework} = createFramework();
        expect(() => new WebGpuInspectTextureArrayRenderPipeline(framework, uniform("pv"), undefined as any, uniform("fragment")))
            .toThrow(/WebGpuInspectTextureArrayRenderPipeline: modelBuffer is required/);
    });
});
