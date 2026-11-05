import {afterEach, describe, expect, it, vi} from "vitest";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {TextureUsage} from "../src/api/rendering/texture/TextureUsage";
import {RenderPassColorAttachment} from "../src/api/rendering/renderpass/RenderPassColorAttachment";
import {WebGpuTexture2D} from "../src/webgpu/texture/WebGpuTexture2D";
import {WebGpuRenderPass} from "../src/webgpu/render-pass/WebGpuRenderPass";
import type {WebGpuGraphicsDevice} from "../src/webgpu/WebGpuGraphicsDevice";
import {WebGlTexture2D} from "../src/webgl/texture/WebGlTexture2D";

function createFramework() {
    const createView = vi.fn((desc?: GPUTextureViewDescriptor) => ({viewDesc: desc}));
    const destroy = vi.fn();
    const createTexture = vi.fn((desc: GPUTextureDescriptor) => ({desc, createView, destroy}));
    const device = {
        createTexture,
        pushErrorScope: vi.fn(),
        popErrorScope: vi.fn(() => Promise.resolve(null)),
        queue: {writeTexture: vi.fn(), copyExternalImageToTexture: vi.fn()},
    };
    const framework = {renderer: {graphicsDevice: {device, api: "WEB_GPU", features: {supportsTextureView: true}}}} as any;
    return {framework, createTexture, createView, destroy};
}

describe("WebGPU texture views", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("passes viewFormats to the GPU texture and creates native views in those formats, cached per format", () => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        const {framework, createTexture, createView} = createFramework();
        const texture = new WebGpuTexture2D(framework, {
            width: 4, height: 4,
            textureFormat: TextureFormat.RGBA8_UNORM,
            textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.RENDER_ATTACHMENT,
            viewFormats: [TextureFormat.RGBA8_UNORM_SRGB],
        });
        texture.initialize();

        expect(createTexture.mock.calls[0][0].viewFormats).toEqual(["rgba8unorm-srgb"]);
        // Usage is used as given.
        expect(createTexture.mock.calls[0][0].usage).toBe(4 | 16);

        const srgb = texture.getTextureView(TextureFormat.RGBA8_UNORM_SRGB);
        expect(createView).toHaveBeenLastCalledWith(expect.objectContaining({format: "rgba8unorm-srgb", dimension: "2d"}));
        expect(srgb.nativeObject).toBe(createView.mock.results.at(-1)!.value);
        expect(texture.getTextureView(TextureFormat.RGBA8_UNORM_SRGB)).toBe(srgb);
        expect(texture.gpuDefaultView).toBe(texture.defaultTextureView.nativeObject);
        expect(createView).toHaveBeenCalledTimes(2);
    });

    it("does not set viewFormats when only the texture format is used", () => {
        vi.stubGlobal("GPUTextureUsage", {COPY_SRC: 1, COPY_DST: 2, TEXTURE_BINDING: 4, STORAGE_BINDING: 8, RENDER_ATTACHMENT: 16});
        const {framework, createTexture} = createFramework();
        const texture = new WebGpuTexture2D(framework, {width: 1, height: 1, textureFormat: TextureFormat.RGBA8_UNORM});
        texture.initialize();
        expect(createTexture.mock.calls[0][0].viewFormats).toBeUndefined();
        expect(() => texture.getTextureView(TextureFormat.RGBA8_UNORM_SRGB)).toThrow(/not in viewFormats/);
    });

    it("render pass uses the view set by setColorAttachment on the next beginPass", () => {
        const beginRenderPass = vi.fn(() => ({end: vi.fn()}));
        const graphicsDevice = {
            device: {createCommandEncoder: vi.fn(() => ({beginRenderPass, finish: vi.fn()})), queue: {submit: vi.fn()}},
            currentRenderPassEncoder: null,
        } as unknown as WebGpuGraphicsDevice;
        const first = new RenderPassColorAttachment();
        first.view = {nativeObject: "linear-view"} as any;
        const pass = new WebGpuRenderPass(graphicsDevice, {colorAttachments: [first]} as any);

        const second = new RenderPassColorAttachment();
        second.view = {nativeObject: "srgb-view"} as any;
        pass.setColorAttachment(0, second);
        pass.beginPass();

        const desc = (beginRenderPass.mock.calls[0] as unknown as [GPURenderPassDescriptor])[0];
        expect((desc.colorAttachments as GPURenderPassColorAttachment[])[0].view).toBe("srgb-view");
        expect(() => pass.setColorAttachment(1, second)).toThrow(/out of range/);
    });
});

describe("WebGL texture views", () => {
    it("throws from getTextureView because supportsTextureView is false", () => {
        const gl = new Proxy({}, {
            get: (_t, prop: string) => {
                if (prop === "createTexture") return () => ({id: "tex"});
                if (prop === "getError") return () => 0;
                if (prop === "getExtension") return () => null;
                return () => undefined;
            },
        }) as unknown as WebGL2RenderingContext;
        const framework = {
            renderer: {
                graphicsDevice: {
                    gl,
                    api: "WEB_GL",
                    features: {supportsTextureView: false},
                },
                preferredTextureFormat: TextureFormat.RGBA8_UNORM,
            },
        } as any;
        if (!("HTMLImageElement" in globalThis)) {
            (globalThis as Record<string, unknown>).HTMLImageElement = class {};
        }
        const texture = new WebGlTexture2D(framework, {
            width: 1, height: 1, textureFormat: TextureFormat.RGBA8_UNORM,
        });
        texture.initialize();
        expect(() => texture.getTextureView(TextureFormat.RGBA8_UNORM)).toThrow(/does not support texture views/i);
        expect(() => texture.defaultTextureView).toThrow(/does not support texture views/i);
    });
});
