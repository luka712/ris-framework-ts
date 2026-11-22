import { describe, expect, it, vi } from "vitest";
import { Framework } from "../src/Framework.ts";
import { type IFrameworkConfiguration, OutputColorSpace, TextureFormat } from "../src/api/index.ts";
import { WebGlSwapChain } from "../src/webgl/swap-chain/WebGlSwapChain.ts";

function createFramework(outputColorSpace?: OutputColorSpace) {
    const canvas = { addEventListener: vi.fn(), style: {}, width: 800, height: 600 } as unknown as HTMLCanvasElement;
    const config: IFrameworkConfiguration = { canvas, outputColorSpace };
    return new Framework(config);
}

describe("renderer.outputColorSpace", () => {
    it("defaults to NONE", () => {
        const framework = createFramework();
        expect(framework.renderer.outputColorSpace).toBe(OutputColorSpace.NONE);
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA8_UNORM);
    });

    it("starts from the configuration and preferredTextureFormat follows a switch", () => {
        const framework = createFramework(OutputColorSpace.NONE);
        expect(framework.renderer.outputColorSpace).toBe(OutputColorSpace.NONE);
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA8_UNORM);

        framework.renderer.outputColorSpace = OutputColorSpace.SRGB;
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA8_UNORM_SRGB);

        framework.renderer.outputColorSpace = OutputColorSpace.NONE;
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA8_UNORM);
    });
});

describe("WebGlSwapChain", () => {
    it("always reports RGBA8_UNORM", () => {
        const canvas = { addEventListener: vi.fn(), width: 1, height: 1 } as unknown as HTMLCanvasElement;
        expect(new WebGlSwapChain(canvas, {} as never).textureFormat).toBe(TextureFormat.RGBA8_UNORM);
    });
});

describe("renderer.outputColorSpace setter", () => {
    it("updates the blit pipeline outputColorSpace without recreating or reattaching the main render target", () => {
        const framework = createFramework(OutputColorSpace.NONE);
        const setColorAttachment = vi.fn();
        const pipeline = {
            outputColorSpace: OutputColorSpace.NONE,
            gamma: 2.2,
            flipY: true,
        };
        const renderer = framework.renderer as unknown as {
            outputColorSpace: OutputColorSpace;
            _mainRenderTarget: object;
            _mainRenderTargetRenderPass: object;
            _mainRenderTargetPipeline: typeof pipeline;
            _mainRenderTargetRequiresResize: boolean;
        };
        renderer._mainRenderTarget = { label: "main" };
        renderer._mainRenderTargetRenderPass = { setColorAttachment };
        renderer._mainRenderTargetPipeline = pipeline;

        renderer.outputColorSpace = OutputColorSpace.SRGB;
        expect(pipeline.outputColorSpace).toBe(OutputColorSpace.SRGB);
        expect(setColorAttachment).not.toHaveBeenCalled();
        expect(renderer._mainRenderTargetRequiresResize).toBe(false);

        renderer.outputColorSpace = OutputColorSpace.NONE;
        expect(pipeline.outputColorSpace).toBe(OutputColorSpace.NONE);

        pipeline.outputColorSpace = OutputColorSpace.NONE;
        renderer.outputColorSpace = OutputColorSpace.NONE;
        expect(setColorAttachment).not.toHaveBeenCalled();
    });
});
