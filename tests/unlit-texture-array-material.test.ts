import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {UnlitTextureArrayMaterial} from "../src/api/material/UnlitTextureArrayMaterial.ts";
import {MaterialFactory} from "../src/api/material/MaterialFactory.ts";
import {Color} from "../src/api/data/Color.ts";
import type {IFramework} from "../src/api/IFramework.ts";
import type {ICamera} from "../src/api/camera/ICamera.ts";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat.ts";
import {GlslShaderModuleContent, WgslShaderModuleContent} from "../src/api/content/ShaderModuleContent.ts";
import {WebGpuShaderModule} from "../src/webgpu/shader/WebGpuShaderModule.ts";
import {WebGpuRenderPipelineFactory} from "../src/webgpu/render-pipelines/WebGpuRenderPipelineFactory.ts";
import {WebGpuUnlitTextureArrayRenderPipeline} from "../src/webgpu/render-pipelines/material/WebGpuUnlitTextureArrayRenderPipeline.ts";
import {WebGpuTextureFactory} from "../src/webgpu/texture/WebGpuTextureFactory.ts";
// WebGlUtilities first: importing WebGL texture code directly hits the WebGlUtilities import cycle.
import "../src/webgl/utilities/WebGlUtilities.ts";
import {WebGlUnlitTextureArrayRenderPipeline} from "../src/webgl/render-pipelines/material/WebGlUnlitTextureArrayRenderPipeline.ts";
import {WebGlTextureFactory} from "../src/webgl/texture/WebGlTextureFactory.ts";
import {IndexBufferType} from "../src/api/index.ts";

/** A framework whose pipeline factory records the unlit texture array pipeline. */
function fakeFramework() {
    const createUniformBuffer = vi.fn((data: ArrayLike<number>) => ({data: Array.from(data), update: vi.fn(), dispose: vi.fn()}));
    const pipeline = {
        render: vi.fn(), dispose: vi.fn(),
        projectionViewBuffer: undefined as unknown, modelBuffer: undefined as unknown,
        diffuseTexture: undefined as unknown, diffuseTextureSampler: undefined as unknown,
    };
    const createUnlitTextureArrayRenderPipeline = vi.fn((projectionView: unknown, model: unknown) => {
        pipeline.projectionViewBuffer = projectionView;
        pipeline.modelBuffer = model;
        return pipeline;
    });
    const framework = {
        bufferFactory: {createUniformBuffer},
        renderPipelineFactory: {createUnlitTextureArrayRenderPipeline},
    } as unknown as IFramework;
    return {framework, pipeline, createUniformBuffer, createUnlitTextureArrayRenderPipeline};
}

describe("UnlitTextureArrayMaterial", () => {
    it("creates its own buffers, and the pipeline only once a model buffer is assigned", () => {
        const {framework, pipeline, createUniformBuffer, createUnlitTextureArrayRenderPipeline} = fakeFramework();
        const material = new MaterialFactory(framework).createUnlitTextureArrayMaterial();
        expect(material).toBeInstanceOf(UnlitTextureArrayMaterial);
        // Projection view placeholder (mat4) and material data (8 floats).
        expect(createUniformBuffer.mock.calls.map(([data]) => data.length)).toEqual([16, 8]);
        expect(createUniformBuffer.mock.results[1].value.data).toEqual([1, 1, 1, 1, 0, 0, 0, 0]);
        expect(material.layer).toBe(0);
        expect(() => material.render({} as never, {} as never)).toThrow("UnlitTextureArrayMaterial.render: no modelBuffer");

        const texture = {id: 1} as never;
        const sampler = {id: 2} as never;
        material.diffuseTexture = texture;
        material.diffuseTextureSampler = sampler;
        expect(createUnlitTextureArrayRenderPipeline).not.toHaveBeenCalled();

        const model = {update: vi.fn(), dispose: vi.fn()};
        material.modelBuffer = model as never;
        expect(createUnlitTextureArrayRenderPipeline).toHaveBeenCalledOnce();
        expect(pipeline.modelBuffer).toBe(model);
        expect(pipeline.diffuseTexture).toBe(texture);
        expect(pipeline.diffuseTextureSampler).toBe(sampler);

        material.render({} as never, {} as never, 6, 0);
        expect(pipeline.render).toHaveBeenCalledWith({}, {}, 6, 0);

        material.dispose();
        expect(pipeline.dispose).toHaveBeenCalledOnce();
        expect(model.dispose).not.toHaveBeenCalled();
    });

    it("uploads [r, g, b, a, layer, 0, 0, 0] when the color or layer changes", () => {
        const {framework, createUniformBuffer} = fakeFramework();
        const material = new UnlitTextureArrayMaterial(framework);
        const materialBuffer = createUniformBuffer.mock.results[1].value;

        material.beforeRender();
        expect(materialBuffer.update).not.toHaveBeenCalled();

        material.layer = 3;
        material.beforeRender();
        expect(Array.from(materialBuffer.update.mock.calls[0][0] as Float32Array)).toEqual([1, 1, 1, 1, 3, 0, 0, 0]);

        material.diffuseColor = new Color(0.5, 0.25, 1, 1);
        material.beforeRender();
        expect(Array.from(materialBuffer.update.mock.calls[1][0] as Float32Array)).toEqual([0.5, 0.25, 1, 1, 3, 0, 0, 0]);

        material.beforeRender();
        expect(materialBuffer.update).toHaveBeenCalledTimes(2);
    });

    it("binds the camera's projection view buffer and disposes only its own placeholder", () => {
        const {framework, pipeline, createUniformBuffer} = fakeFramework();
        const material = new UnlitTextureArrayMaterial(framework);
        material.modelBuffer = {update: vi.fn(), dispose: vi.fn()} as never;
        const own = createUniformBuffer.mock.results[0].value;

        const camera = {projectionViewBuffer: {id: "pv", dispose: vi.fn()}} as unknown as ICamera;
        material.camera = camera;
        expect(pipeline.projectionViewBuffer).toBe(camera.projectionViewBuffer);
        expect(own.dispose).toHaveBeenCalledOnce();

        material.dispose();
        expect((camera.projectionViewBuffer as unknown as {dispose: ReturnType<typeof vi.fn>}).dispose).not.toHaveBeenCalled();
    });

    it("uses a descriptor camera without creating a placeholder buffer", () => {
        const {framework, createUniformBuffer} = fakeFramework();
        const camera = {projectionViewBuffer: {id: "pv"}} as unknown as ICamera;
        const material = new UnlitTextureArrayMaterial(framework, {camera});
        expect(material.camera).toBe(camera);
        expect(createUniformBuffer).toHaveBeenCalledOnce();
    });
});

describe("unlit texture array shaders", () => {
    it("registers a GLSL program sharing the unlit vertex shader with a sampler2DArray fragment shader", () => {
        const entry = GlslShaderModuleContent["unlit_texture_array_material"];
        expect(entry.vertex).toBe(GlslShaderModuleContent["unlit_material"].vertex);
        expect(entry.fragment).toContain("uniform sampler2DArray u_textureArray;");
        expect(entry.fragment).toContain("float layer;");
    });

    it("registers a WGSL program that includes the shared mesh vertex module and samples a texture_2d_array", () => {
        const shader = WgslShaderModuleContent["unlit_texture_array_material"].shader!;
        expect(shader).toContain('#include "modules/mesh_vertex.wgsl"');
        expect(shader).toContain("texture_2d_array<f32>");
        expect(WgslShaderModuleContent["unlit_material"].shader).toContain('#include "modules/mesh_vertex.wgsl"');

        // Expand the include the way WebGpuShaderModule does.
        const proto = WebGpuShaderModule.prototype as unknown as {
            _injectModules(source: string): string;
            _loadModule(path: string): string;
        };
        const fake = {
            _modules: {},
            _moduleRegex: /^\s*#include\s+"([^"]+)"\s*;?\s*$/gm,
            _loadModule: proto._loadModule,
            _injectModules: proto._injectModules,
        };
        const expanded = fake._injectModules(shader);
        expect(expanded).not.toMatch(/^\s*#include/m);
        expect(expanded).toContain("fn main_vs");
        expect(expanded).toContain("fn main_fs");
        expect(expanded).toContain("@group(0) @binding(1) var<uniform> model");
    });
});

describe("WebGpuUnlitTextureArrayRenderPipeline", () => {
    beforeEach(() => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        vi.stubGlobal("GPUShaderStage", {VERTEX: 1, FRAGMENT: 2, COMPUTE: 4});
    });
    afterEach(() => vi.unstubAllGlobals());

    function createFramework() {
        const encoder = {setPipeline: vi.fn(), setVertexBuffer: vi.fn(), setIndexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn()};
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
        const loadShaderModule = vi.fn(() => ({gpuShaderModule: {module: "unlit_texture_array_material"}}));
        const framework = {
            renderer: {
                graphicsDevice: {
                    device, api: "WEB_GPU",
                    features: {supportsTextureView: true},
                    defaultBlendState: {gpuBlendState: undefined},
                    defaultTextureSampler: {id: 7, gpuSampler: {sampler: "default"}},
                    defaultPrimitiveState: {gpuPrimitiveState: {topology: "triangle-list"}},
                    renderPassEncoder: encoder,
                },
                preferredTextureFormat: TextureFormat.RGBA8_UNORM,
                preferredDepthStencilFormat: TextureFormat.DEPTH24_PLUS_STENCIL8,
            },
            content: {loadShaderModule},
        } as any;
        framework.textureFactory = new WebGpuTextureFactory(framework);
        return {framework, device, encoder, loadShaderModule};
    }

    const uniform = (name: string) => ({gpuBuffer: {name, size: 64}}) as any;

    it("is created by the WebGPU factory with a 2d-array texture group and a material group at binding 2", () => {
        const {framework, device, loadShaderModule} = createFramework();
        const pipeline = new WebGpuRenderPipelineFactory(framework)
            .createUnlitTextureArrayRenderPipeline(uniform("pv"), uniform("model"), uniform("material"));

        expect(pipeline).toBeInstanceOf(WebGpuUnlitTextureArrayRenderPipeline);
        expect(loadShaderModule).toHaveBeenCalledWith("unlit_texture_array_material");
        const layouts = device.createBindGroupLayout.mock.calls.map(([desc]) => [...desc.entries]);
        expect(layouts).toHaveLength(3);
        expect(layouts[1][0]).toMatchObject({binding: 0, texture: {sampleType: "float", viewDimension: "2d-array"}});
        expect(layouts[2][0]).toMatchObject({binding: 2, buffer: {type: "uniform"}});
    });

    it("binds the default texture array when none is set, and draws", () => {
        const {framework, encoder} = createFramework();
        const pipeline = new WebGpuUnlitTextureArrayRenderPipeline(framework, uniform("pv"), uniform("model"), uniform("material"));
        pipeline.initialize();
        pipeline.render({gpuBuffer: {}, byteSize: 144} as any, {gpuBuffer: {}, gpuIndexFormat: "uint16", paddedByteSize: 12, indicesCount: 6} as any);

        expect(encoder.setBindGroup.mock.calls.map(([group]) => group)).toEqual([0, 1, 2]);
        expect(encoder.drawIndexed).toHaveBeenCalledWith(6, 1, 0);
        expect(pipeline.diffuseTexture).toBe((framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2DArray());
    });

    it("requires a model buffer", () => {
        const {framework} = createFramework();
        expect(() => new WebGpuUnlitTextureArrayRenderPipeline(framework, uniform("pv"), undefined as any, uniform("material")))
            .toThrow("WebGpuUnlitTextureArrayRenderPipeline: modelBuffer is required");
    });
});

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
    return {gl, calls, constant: (name: string) => (gl as unknown as Record<string, number>)[name]};
}

describe("WebGlUnlitTextureArrayRenderPipeline", () => {
    it("binds the three uniform blocks and draws with the texture array on TEXTURE_2D_ARRAY", () => {
        const {gl, calls, constant} = recordingGl();
        const framework = {
            renderer: {
                graphicsDevice: {
                    gl, api: "WEB_GL",
                    features: {supportsTextureView: false, supportsTextureFormat: () => true},
                    defaultBlendState: {apply: vi.fn()},
                    defaultTextureSampler: {glSampler: {sampler: "default"}},
                    defaultPrimitiveState: {apply: vi.fn(), glPrimitiveType: 4},
                },
                preferredTextureFormat: TextureFormat.RGBA8_UNORM,
            },
            content: {loadShaderModule: vi.fn(() => ({program: {program: "unlit_texture_array_material"}}))},
        } as any;
        framework.textureFactory = new WebGlTextureFactory(framework);

        const glBuffer = (name: string) => ({glBuffer: {name}}) as any;
        const pipeline = new WebGlUnlitTextureArrayRenderPipeline(framework, glBuffer("pv"), glBuffer("model"), glBuffer("material"));
        pipeline.initialize();
        expect(framework.content.loadShaderModule).toHaveBeenCalledWith("unlit_texture_array_material");
        const blocks = calls.filter(([name]) => name === "getUniformBlockIndex").map(([, args]) => args[1]);
        expect(blocks).toEqual(["CameraBuffer", "ModelBuffer", "MaterialBuffer"]);

        calls.length = 0;
        pipeline.render({buffer: {}} as any, {buffer: {}, type: IndexBufferType.UINT_16, indicesCount: 6, elementByteSize: 2} as any);
        const bindTexture = calls.find(([name]) => name === "bindTexture")!;
        expect(bindTexture[1][0]).toBe(constant("TEXTURE_2D_ARRAY"));
        expect(bindTexture[1][1]).toBe((framework.textureFactory as WebGlTextureFactory).getOrCreateDefaultTexture2DArray().glTexture);
        expect(calls.find(([name]) => name === "drawElements")![1]).toEqual([4, 6, constant("UNSIGNED_SHORT"), 0]);
    });
});
