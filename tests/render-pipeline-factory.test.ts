import { describe, expect, it, vi } from "vitest";
import type { IFramework, IPrimitiveState, IUniformBuffer } from "../src/api/index.ts";

// The real pipeline needs a WebGL context; replace it with a recorder.
const created: { args: unknown[]; initialize: ReturnType<typeof vi.fn> }[] = [];
vi.mock("../src/webgl/render-pipelines/material/WebGlBlinnPhongRenderPipeline.ts", () => ({
    WebGlForwardBlinnPhongRenderPipeline: class {
        public initialize = vi.fn();
        public setLightCounts = vi.fn();
        public maxDirectionalLights = 3;
        public maxPointLights = 3;
        public constructor(...args: unknown[]) {
            created.push({ args, initialize: this.initialize });
        }
    },
}));

const { WebGlRenderPipelineFactory } = await import("../src/webgl/render-pipelines/WebGlRenderPipelineFactory.ts");

describe("WebGlRenderPipelineFactory.createForwardBlinnPhongRenderPipeline", () => {
    it("passes the buffers in order, initializes and returns the pipeline", () => {
        const framework = {} as IFramework;
        const buffer = (label: string) => ({ label }) as unknown as IUniformBuffer;
        const projectionView = buffer("projectionView");
        const model = buffer("model");
        const material = buffer("material");
        const lights = buffer("lights");
        const cameraPosition = buffer("cameraPosition");
        const primitiveState = {} as IPrimitiveState;

        const pipeline = new WebGlRenderPipelineFactory(framework)
            .createForwardBlinnPhongRenderPipeline({
                projectionViewBuffer: projectionView,
                modelBuffer: model,
                materialBuffer: material,
                lightsBuffer: lights,
                cameraPositionBuffer: cameraPosition,
                primitiveState,
            });

        expect(created).toHaveLength(1);
        expect(created[0].args).toEqual([framework, projectionView, model, material, lights, cameraPosition, primitiveState]);
        expect(created[0].initialize).toHaveBeenCalledOnce();
        expect((pipeline as unknown as { initialize: unknown }).initialize).toBe(created[0].initialize);
        expect((pipeline as unknown as { setLightCounts: ReturnType<typeof vi.fn> }).setLightCounts).not.toHaveBeenCalled();
    });

    it("sets the light counts before initializing when the descriptor has them", () => {
        const buffer = {} as IUniformBuffer;
        const pipeline = new WebGlRenderPipelineFactory({} as IFramework).createForwardBlinnPhongRenderPipeline({
            projectionViewBuffer: buffer, modelBuffer: buffer, materialBuffer: buffer, cameraPositionBuffer: buffer,
            maxPointLights: 1,
        }) as unknown as { setLightCounts: ReturnType<typeof vi.fn>; initialize: ReturnType<typeof vi.fn> };

        expect(pipeline.setLightCounts).toHaveBeenCalledWith(3, 1);
        expect(pipeline.setLightCounts.mock.invocationCallOrder[0]).toBeLessThan(pipeline.initialize.mock.invocationCallOrder[0]);
    });
});
