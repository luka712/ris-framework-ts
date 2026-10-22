import { describe, expect, it, vi } from "vitest";
import { UnlitMaterial } from "../src/api/material/UnlitMaterial.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import type { ICamera } from "../src/api/camera/ICamera.ts";

function fakeFramework() {
    const createUniformBuffer = vi.fn((data: ArrayLike<number>) => ({ data: Array.from(data), update: vi.fn(), dispose: vi.fn() }));
    const pipeline = { render: vi.fn(), dispose: vi.fn(), projectionViewBuffer: undefined as unknown };
    const createUnlitRenderPipeline = vi.fn((projectionView: unknown, model: unknown) => {
        pipeline.projectionViewBuffer = projectionView;
        (pipeline as unknown as { modelBuffer: unknown }).modelBuffer = model;
        return pipeline;
    });
    const framework = {
        bufferFactory: { createUniformBuffer },
        renderPipelineFactory: { createUnlitRenderPipeline },
    } as unknown as IFramework;
    return { framework, pipeline };
}

describe("UnlitMaterial.camera", () => {
    it("starts with an own buffer and binds the camera's projection view buffer when assigned", () => {
        const { framework, pipeline } = fakeFramework();
        const material = new UnlitMaterial(framework);
        material.modelBuffer = { update: vi.fn(), dispose: vi.fn() } as never;
        const own = pipeline.projectionViewBuffer as { dispose: ReturnType<typeof vi.fn> };
        expect(material.camera).toBeUndefined();

        const camera = { projectionViewBuffer: { id: "pv" } } as unknown as ICamera;
        material.camera = camera;
        expect(pipeline.projectionViewBuffer).toBe(camera.projectionViewBuffer);
        expect(own.dispose).toHaveBeenCalledOnce();

        const next = { projectionViewBuffer: { id: "pv2" } } as unknown as ICamera;
        material.camera = next;
        expect(pipeline.projectionViewBuffer).toBe(next.projectionViewBuffer);
        expect(own.dispose).toHaveBeenCalledOnce();
    });
});

describe("UnlitMaterial.modelBuffer", () => {
    it("creates no model buffer, binds the assigned one and never disposes it", () => {
        const { framework, pipeline } = fakeFramework();
        const material = new UnlitMaterial(framework);
        // Own buffers: projection view placeholder and material buffer only.
        expect((framework.bufferFactory.createUniformBuffer as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
        expect(() => material.render({} as never, {} as never)).toThrow("UnlitMaterial: no modelBuffer");
        expect(framework.renderPipelineFactory.createUnlitRenderPipeline).not.toHaveBeenCalled();

        const model = { update: vi.fn(), dispose: vi.fn() };
        material.modelBuffer = model as never;
        expect((pipeline as unknown as { modelBuffer: unknown }).modelBuffer).toBe(model);
        material.render({} as never, {} as never);
        material.dispose();
        expect(model.dispose).not.toHaveBeenCalled();
    });
});
