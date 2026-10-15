import { describe, expect, it, vi } from "vitest";
import { vec3 } from "gl-matrix";
import { CameraFactory } from "../src/api/camera/CameraFactory.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import { PerspectiveCamera } from "../src/api/camera/PerspectiveCamera.ts";
import type { Scene } from "../src/api/scene/Scene.ts";

function fakeFramework() {
    const createUniformBuffer = vi.fn((data: ArrayLike<number>) => ({ data: Array.from(data), update: vi.fn(), dispose: vi.fn() }));
    return { framework: { bufferFactory: { createUniformBuffer } } as unknown as IFramework, createUniformBuffer };
}

describe("CameraFactory.createPerspectiveCamera", () => {
    it("uses the defaults without a descriptor", () => {
        const camera = new CameraFactory(fakeFramework().framework).createPerspectiveCamera();
        expect(camera.fieldOfView).toBeCloseTo(Math.PI / 3);
        expect([camera.aspectRatio, camera.nearPlane, camera.farPlane]).toEqual([1, 0.01, 100]);
        expect([...camera.eye]).toEqual([0, 0, 3]);
        expect([...camera.target]).toEqual([0, 0, 0]);
        expect([...camera.up]).toEqual([0, 1, 0]);
    });

    it("applies every descriptor field, converts fov from degrees and copies the vectors", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        const eye = vec3.fromValues(1, 2, 5);
        const camera = new CameraFactory(framework).createPerspectiveCamera({
            fov: 90, aspectRatio: 2, near: 0.5, far: 50, eye, target: [0, 1, 0], up: [0, 0, 1],
        });

        expect(camera.fieldOfView).toBeCloseTo(Math.PI / 2);
        expect([camera.aspectRatio, camera.nearPlane, camera.farPlane]).toEqual([2, 0.5, 50]);
        expect([...camera.eye]).toEqual([1, 2, 5]);
        expect(camera.eye).not.toBe(eye);
        expect([...camera.target]).toEqual([0, 1, 0]);
        expect([...camera.up]).toEqual([0, 0, 1]);
        // The position buffer is created after the eye is applied (world eye has z flipped).
        expect(createUniformBuffer.mock.calls[0][0]).toEqual(expect.objectContaining({ 0: 1, 1: 2, 2: -5 }));
    });

    it("keeps defaults for omitted fields", () => {
        const camera = new CameraFactory(fakeFramework().framework).createPerspectiveCamera({ far: 1000 });
        expect([camera.aspectRatio, camera.nearPlane, camera.farPlane]).toEqual([1, 0.01, 1000]);
        expect([...camera.eye]).toEqual([0, 0, 3]);
    });

    it("assigns itself as the scene camera when a scene is given", () => {
        const scene = { camera: undefined, add(this: { camera: unknown }, item: unknown) { this.camera = item; } } as unknown as Scene;
        const camera = new CameraFactory(fakeFramework().framework).createPerspectiveCamera({ fov: 45 }, scene);
        expect(scene.camera).toBe(camera);
        expect(camera.fieldOfView).toBeCloseTo(Math.PI / 4);
    });
});

describe("PerspectiveCamera constructor", () => {
    it("applies the descriptor without a scene", () => {
        const camera = new PerspectiveCamera(fakeFramework().framework, { fov: 90, aspectRatio: 2, near: 1, far: 10, eye: [1, 2, 3] });
        expect(camera.fieldOfView).toBeCloseTo(Math.PI / 2);
        expect([camera.aspectRatio, camera.nearPlane, camera.farPlane]).toEqual([2, 1, 10]);
        expect([...camera.eye]).toEqual([1, 2, 3]);
    });
});
