import { describe, expect, it, vi } from "vitest";
import { Color } from "../src/api/data/Color.ts";
import { ForwardBlinnPhongMaterial } from "../src/api/material/ForwardBlinnPhongMaterial.ts";
import { PerspectiveCamera } from "../src/api/camera/PerspectiveCamera.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import type { ICamera } from "../src/api/camera/ICamera.ts";
import type { IUniformBuffer } from "../src/api/rendering/buffers/IUniformBuffer.ts";
import type { LightsBuffer } from "../src/api/lights/LightsBuffer.ts";

function fakeFramework() {
    const buffers: { data: number[]; update: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[] = [];
    const createUniformBuffer = vi.fn((data: ArrayLike<number>) => {
        const buffer = { data: Array.from(data), update: vi.fn(), dispose: vi.fn() };
        buffers.push(buffer);
        return buffer;
    });
    const pipeline = { render: vi.fn(), dispose: vi.fn(), setLightCounts: vi.fn(), lightsBuffer: undefined as unknown };
    const createForwardBlinnPhongRenderPipeline = vi.fn((descriptor: { modelBuffer: unknown }) => {
        (pipeline as unknown as { modelBuffer: unknown }).modelBuffer = descriptor.modelBuffer;
        return pipeline;
    });
    const lightsBuffer = {
        buffer: { id: "lights" }, maxDirectionalLights: 3, maxPointLights: 5,
        ambientLight: undefined as unknown, directionalLights: [] as unknown[], pointLights: [] as unknown[],
        update: vi.fn(), dispose: vi.fn(),
    };
    const __createLightsBuffer = vi.fn(() => lightsBuffer as unknown as LightsBuffer);
    const framework = {
        bufferFactory: { createUniformBuffer },
        renderPipelineFactory: { createForwardBlinnPhongRenderPipeline },
        lightsFactory: { __createLightsBuffer },
    } as unknown as IFramework;
    return { framework, buffers, pipeline, createForwardBlinnPhongRenderPipeline, lightsBuffer, __createLightsBuffer };
}

/** A mesh's model buffer. */
const fakeModel = () => ({ update: vi.fn(), dispose: vi.fn() }) as unknown as IUniformBuffer;

/** The required shared buffers (normally the camera's). */
const shared = () => ({
    projectionViewBuffer: { update: vi.fn(), dispose: vi.fn() } as unknown as IUniformBuffer,
    cameraPositionBuffer: { update: vi.fn(), dispose: vi.fn() } as unknown as IUniformBuffer,
});

describe("ForwardBlinnPhongMaterial", () => {
    it("uses the descriptor's shared buffers and rebinds them when a camera is assigned", () => {
        const { framework, pipeline, createForwardBlinnPhongRenderPipeline } = fakeFramework();
        const desc = shared();
        const material = new ForwardBlinnPhongMaterial(framework, desc);
        material.modelBuffer = fakeModel();
        const descriptor = (createForwardBlinnPhongRenderPipeline.mock.calls[0] as unknown[])[0] as { projectionViewBuffer: unknown; cameraPositionBuffer: unknown };
        expect(descriptor.projectionViewBuffer).toBe(desc.projectionViewBuffer);
        expect(descriptor.cameraPositionBuffer).toBe(desc.cameraPositionBuffer);
        expect(material.camera).toBeUndefined();

        const camera = { projectionViewBuffer: { dispose: vi.fn() }, positionBuffer: { dispose: vi.fn() } } as unknown as ICamera;
        material.camera = camera;
        expect(material.camera).toBe(camera);
        expect((pipeline as unknown as { projectionViewBuffer: unknown }).projectionViewBuffer).toBe(camera.projectionViewBuffer);
        expect((pipeline as unknown as { cameraPositionBuffer: unknown }).cameraPositionBuffer).toBe(camera.positionBuffer);

        // Shared buffers are never disposed by the material.
        material.dispose();
        for (const buffer of [desc.projectionViewBuffer, desc.cameraPositionBuffer, camera.projectionViewBuffer, camera.positionBuffer]) {
            expect((buffer as unknown as { dispose: ReturnType<typeof vi.fn> }).dispose).not.toHaveBeenCalled();
        }
    });

    it("throws a clear error when a required buffer is missing (JS callers)", () => {
        const { framework } = fakeFramework();
        const desc = shared();
        expect(() => new ForwardBlinnPhongMaterial(framework, undefined as never))
            .toThrow("descriptor.projectionViewBuffer and descriptor.cameraPositionBuffer are required");
        expect(() => new ForwardBlinnPhongMaterial(framework, { projectionViewBuffer: desc.projectionViewBuffer } as never))
            .toThrow("descriptor.cameraPositionBuffer is required");
        expect(() => new ForwardBlinnPhongMaterial(framework, { cameraPositionBuffer: desc.cameraPositionBuffer } as never))
            .toThrow("descriptor.projectionViewBuffer is required");
    });

    it("creates the pipeline once a model buffer is assigned, never disposes it and throws when rendering without one", () => {
        const { framework, pipeline, createForwardBlinnPhongRenderPipeline } = fakeFramework();
        const material = new ForwardBlinnPhongMaterial(framework, shared());
        expect(material.modelBuffer).toBeUndefined();
        expect(createForwardBlinnPhongRenderPipeline).not.toHaveBeenCalled();
        expect(() => material.render({} as never, {} as never)).toThrow("no modelBuffer");

        const model = { update: vi.fn(), dispose: vi.fn() } as unknown as IUniformBuffer;
        material.modelBuffer = model;
        expect((pipeline as unknown as { modelBuffer: unknown }).modelBuffer).toBe(model);
        expect(createForwardBlinnPhongRenderPipeline).toHaveBeenCalledOnce();
        const next = fakeModel();
        material.modelBuffer = next;
        expect(createForwardBlinnPhongRenderPipeline).toHaveBeenCalledOnce();
        expect((pipeline as unknown as { modelBuffer: unknown }).modelBuffer).toBe(next);
        material.render({} as never, {} as never);
        expect(pipeline.render).toHaveBeenCalledOnce();
        material.dispose();
        expect((model as unknown as { dispose: ReturnType<typeof vi.fn> }).dispose).not.toHaveBeenCalled();
    });

    it("owns a 3 directional + 5 point lights buffer, exposes its lights by reference and disposes it", () => {
        const { framework, createForwardBlinnPhongRenderPipeline, lightsBuffer, __createLightsBuffer } = fakeFramework();
        const material = new ForwardBlinnPhongMaterial(framework, shared());
        expect(__createLightsBuffer).toHaveBeenCalledWith({ maxDirectionalLights: 3, maxPointLights: 5 });
        material.modelBuffer = fakeModel();
        expect(createForwardBlinnPhongRenderPipeline.mock.calls[0]).toEqual([expect.objectContaining({
            lightsBuffer: lightsBuffer.buffer, maxDirectionalLights: 3, maxPointLights: 5,
        })]);

        const list: never[] = [];
        material.pointLights = list;
        expect(material.pointLights).toBe(list);
        expect(lightsBuffer.pointLights).toBe(list);
        material.directionalLights = list;
        expect(lightsBuffer.directionalLights).toBe(list);
        const ambient = {} as never;
        material.ambientLight = ambient;
        expect(lightsBuffer.ambientLight).toBe(ambient);

        material.beforeRender();
        expect(lightsBuffer.update).toHaveBeenCalledOnce();
        material.dispose();
        expect(lightsBuffer.dispose).toHaveBeenCalledOnce();
    });

    it("lays out the material buffer as std140 ambient, diffuse, specular + shininess", () => {
        const { framework, createForwardBlinnPhongRenderPipeline } = fakeFramework();
        new ForwardBlinnPhongMaterial(framework, shared()).modelBuffer = fakeModel();

        const descriptor = (createForwardBlinnPhongRenderPipeline.mock.calls[0] as unknown[])[0] as { materialBuffer: { data: number[] } };
        expect(descriptor.materialBuffer.data).toEqual([
            0.1, 0.1, 0.1, 0,
            0.8, 0.8, 0.8, 0,
            0.5, 0.5, 0.5, 32,
        ]);
    });

    it("uploads specular colour and shininess only when they change", () => {
        const { framework, createForwardBlinnPhongRenderPipeline } = fakeFramework();
        const material = new ForwardBlinnPhongMaterial(framework, shared());
        material.modelBuffer = fakeModel();
        const descriptor = (createForwardBlinnPhongRenderPipeline.mock.calls[0] as unknown[])[0] as { materialBuffer: { update: ReturnType<typeof vi.fn> } };

        material.beforeRender();
        expect(descriptor.materialBuffer.update).not.toHaveBeenCalled();

        material.specularColor = new Color(1, 0.5, 0.25);
        material.shininess = 64;
        material.beforeRender();
        expect(descriptor.materialBuffer.update).toHaveBeenCalledOnce();
        expect((descriptor.materialBuffer.update.mock.calls[0][0] as number[]).slice(8, 12)).toEqual([1, 0.5, 0.25, 64]);

        material.beforeRender();
        expect(descriptor.materialBuffer.update).toHaveBeenCalledOnce();
    });
});

describe("PerspectiveCamera.positionBuffer", () => {
    it("holds the world-space eye (z flipped like the view matrix), std140 padded", () => {
        const { framework, buffers } = fakeFramework();
        const camera = new PerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100 });
        camera.eye = [1, 2, 3];
        camera.initialize();

        expect(buffers[0].data).toEqual([1, 2, -3, 0]);

        camera.eye = [0, 0, 5];
        camera.updateBuffers();
        expect(buffers[0].update).toHaveBeenCalledWith([0, 0, -5, 0]);
    });
});
