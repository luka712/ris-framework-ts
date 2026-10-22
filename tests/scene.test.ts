import { describe, expect, it, vi } from "vitest";
import { Scene } from "../src/api/scene/Scene.ts";
import { Mesh } from "../src/api/meshes/Mesh.ts";
import { MeshFactory } from "../src/api/meshes/MeshFactory.ts";
import { GeometryBuilder } from "../src/api/geometry/GeometryBuilder.ts";
import { GeometryFormat } from "../src/api/geometry/GeometryFormat.ts";
import { AmbientLight } from "../src/api/lights/AmbientLight.ts";
import { PointLight } from "../src/api/lights/PointLight.ts";
import { DirectionalLight } from "../src/api/lights/DirectionalLight.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import type { IMaterial } from "../src/api/material/IMaterial.ts";
import type { GameTime } from "../src/api/time/GameTime.ts";
import type { ICamera } from "../src/api/camera/ICamera.ts";

function fakeFramework() {
    const lightsBuffer = { add: vi.fn(), remove: vi.fn(() => true), update: vi.fn(), dispose: vi.fn(), pointLights: [], directionalLights: [], ambientLight: undefined as unknown };
    const framework = {
        lightsFactory: {
            createAmbientLight: vi.fn((desc: unknown, scene?: Scene) => new AmbientLight(desc as never, scene)),
            __createLightsBuffer: vi.fn(() => lightsBuffer),
        },
        geometryBuilder: new GeometryBuilder(),
        bufferFactory: { createVertexBuffer: vi.fn(() => ({ dispose: vi.fn() })), createIndexBuffer: vi.fn(() => ({ dispose: vi.fn() })) },
    } as unknown as IFramework;
    (framework as unknown as { meshFactory: MeshFactory }).meshFactory = new MeshFactory(framework);
    return { framework, lightsBuffer };
}

const material = () => ({
    geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2,
    beforeRender: vi.fn(),
    renderMesh: vi.fn(),
}) as unknown as IMaterial & { beforeRender: ReturnType<typeof vi.fn>; renderMesh: ReturnType<typeof vi.fn> };

describe("Scene", () => {
    it("creates and registers an active ambient light and a lights buffer for it", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        expect(scene.ambientLights).toEqual([scene.activeAmbientLight]);
        expect(framework.lightsFactory.__createLightsBuffer).toHaveBeenCalledWith({
            ambientLight: scene.activeAmbientLight, maxDirectionalLights: 3, maxPointLights: 5,
        });

        const other = new AmbientLight();
        scene.activeAmbientLight = other;
        expect(scene.ambientLights).toContain(other);
        expect(scene.__forwardLightsBuffer.ambientLight).toBe(other);
    });

    it("a mesh adds itself on construction and removes itself on dispose", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const mesh = new Mesh(framework, scene, material());
        expect(scene.meshes).toEqual([mesh]);
        expect(mesh.scene).toBe(scene);

        mesh.dispose();
        expect(scene.meshes).toEqual([]);
    });

    it("adds only the parent mesh of submeshes, and render() draws every submesh once", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const a = material();
        const b = material();
        const geometry = new GeometryBuilder().create({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2, 2, 1, 0] });

        const mesh = framework.meshFactory.createWithSubMeshes(scene, geometry, [
            { material: a, indexStart: 0, indexCount: 3 },
            { material: b, indexStart: 3, indexCount: 3 },
        ]);
        expect(scene.meshes).toEqual([mesh]);

        scene.render();
        expect(a.beforeRender).toHaveBeenCalledOnce();
        expect(a.renderMesh).toHaveBeenCalledWith(mesh.subMeshes![0]);
        expect(b.renderMesh).toHaveBeenCalledWith(mesh.subMeshes![1]);
    });

    it("render() draws a plain mesh with its own material", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const m = material();
        const geometry = new GeometryBuilder().create({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2] });
        const mesh = framework.meshFactory.create(scene, geometry, m);

        scene.render();
        expect(m.beforeRender).toHaveBeenCalledOnce();
        expect(m.renderMesh).toHaveBeenCalledWith(mesh);
    });

    it("delegates lights and update to its lights buffer", () => {
        const { framework, lightsBuffer } = fakeFramework();
        const scene = new Scene(framework);
        const light = new PointLight();

        scene.add(light);
        expect(lightsBuffer.add).toHaveBeenCalledWith(light);
        expect(scene.remove(light)).toBe(true);
        scene.update({} as GameTime);
        expect(lightsBuffer.update).toHaveBeenCalledOnce();
    });

    it("a light given a scene adds itself; without a scene it is not added", () => {
        const { framework, lightsBuffer } = fakeFramework();
        const scene = new Scene(framework);
        new PointLight();
        new DirectionalLight();
        expect(lightsBuffer.add).not.toHaveBeenCalled();

        const point = new PointLight(undefined, scene);
        const directional = new DirectionalLight({ intensity: 2 }, scene);
        expect(lightsBuffer.add).toHaveBeenNthCalledWith(1, point);
        expect(lightsBuffer.add).toHaveBeenNthCalledWith(2, directional);
    });

    it("a light constructor rethrows the scene's slot cap error", () => {
        const { framework, lightsBuffer } = fakeFramework();
        const scene = new Scene(framework);
        lightsBuffer.add.mockImplementation(() => { throw new Error("all 5 point light slots are in use"); });
        expect(() => new PointLight(undefined, scene)).toThrow(/slots are in use/);
    });

    it("dispose() disposes its meshes and lights buffer once", () => {
        const { framework, lightsBuffer } = fakeFramework();
        const scene = new Scene(framework);
        const mesh = new Mesh(framework, scene, material());
        const dispose = vi.spyOn(mesh, "dispose");

        scene.dispose();
        scene.dispose();
        expect(dispose).toHaveBeenCalledOnce();
        expect(scene.meshes).toEqual([]);
        expect(lightsBuffer.dispose).toHaveBeenCalledOnce();
    });
    it("update() assigns its camera to mesh and submesh materials, only when it changed", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        let sets = 0;
        const withCamera = () => {
            let camera: ICamera | undefined;
            const m = material();
            Object.defineProperty(m, "camera", {
                get: () => camera,
                set: (value: ICamera | undefined) => { camera = value; sets++; },
                enumerable: true,
            });
            return m as typeof m & { camera?: ICamera };
        };
        const own = withCamera();
        const a = withCamera();
        const b = withCamera();
        const noCamera = material();
        const geometry = new GeometryBuilder().create({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2, 2, 1, 0] });
        framework.meshFactory.create(scene, geometry, own);
        framework.meshFactory.createWithSubMeshes(scene, geometry, [
            { material: a, indexStart: 0, indexCount: 3 },
            { material: b, indexStart: 3, indexCount: 3 },
        ]);
        framework.meshFactory.create(scene, geometry, noCamera);

        scene.update({} as GameTime);
        expect(sets).toBe(0);

        const camera = { projectionViewBuffer: {}, positionBuffer: {} } as unknown as ICamera;
        scene.camera = camera;
        scene.update({} as GameTime);
        expect([own.camera, a.camera, b.camera]).toEqual([camera, camera, camera]);
        expect("camera" in noCamera).toBe(false);
        expect(sets).toBe(3);

        scene.update({} as GameTime);
        expect(sets).toBe(3);

        const next = { projectionViewBuffer: {}, positionBuffer: {} } as unknown as ICamera;
        scene.camera = next;
        scene.update({} as GameTime);
        expect(a.camera).toBe(next);
        expect(sets).toBe(6);
    });

    describe("add / remove", () => {
        const fakeCamera = () => ({ projectionViewBuffer: {}, positionBuffer: {}, viewMatrix: {}, updateBuffers: vi.fn() }) as unknown as ICamera;

        it("meshes: added once, assigned the camera, removed (not disposed)", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const camera = fakeCamera();
            scene.camera = camera;
            const m = { ...material(), camera: undefined as unknown };
            const mesh = new Mesh(framework, null, m as unknown as IMaterial);
            const dispose = vi.spyOn(mesh, "dispose");
            scene.add(mesh);
            scene.add(mesh);
            expect(scene.meshes).toEqual([mesh]);
            expect(m.camera).toBe(camera);
            expect(scene.remove(mesh)).toBe(true);
            expect(scene.remove(mesh)).toBe(false);
            expect(scene.meshes).toEqual([]);
            expect(dispose).not.toHaveBeenCalled();
        });

        it("a mesh given the scene registers through add and removes itself on dispose", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const add = vi.spyOn(scene, "add");
            const mesh = new Mesh(framework, scene, material());
            expect(add).toHaveBeenCalledWith(mesh);
            mesh.dispose();
            expect(scene.meshes).toEqual([]);
        });

        it("ambient lights: added once; the active one cannot be removed", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const extra = new AmbientLight();
            scene.add(extra);
            scene.add(extra);
            expect(scene.ambientLights).toEqual([scene.activeAmbientLight, extra]);
            expect(() => scene.remove(scene.activeAmbientLight)).toThrow("cannot remove the active ambient light");
            expect(scene.remove(extra)).toBe(true);
            expect(scene.remove(extra)).toBe(false);
            const selfAdded = new AmbientLight(undefined, scene);
            expect(scene.ambientLights).toContain(selfAdded);
        });

        it("directional and point lights go to the lights buffer (duplicates are the buffer's no-op)", () => {
            const { framework, lightsBuffer } = fakeFramework();
            const scene = new Scene(framework);
            const sun = new DirectionalLight();
            const lamp = new PointLight();
            scene.add(sun);
            scene.add(lamp);
            expect(lightsBuffer.add.mock.calls).toEqual([[sun], [lamp]]);
            expect(scene.remove(sun)).toBe(true);
            expect(lightsBuffer.remove).toHaveBeenCalledWith(sun);
        });

        it("the deprecated addLight/removeLight delegate to add/remove", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const add = vi.spyOn(scene, "add");
            const remove = vi.spyOn(scene, "remove");
            const lamp = new PointLight();
            scene.addLight(lamp);
            scene.removeLight(lamp);
            expect(add).toHaveBeenCalledWith(lamp);
            expect(remove).toHaveBeenCalledWith(lamp);
        });

        it("cameras: add sets scene.camera; removing the active one clears it, another returns false", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const camera = fakeCamera();
            const other = fakeCamera();
            scene.add(camera);
            scene.add(camera);
            expect(scene.camera).toBe(camera);
            expect(scene.remove(other)).toBe(false);
            expect(scene.camera).toBe(camera);
            expect(scene.remove(camera)).toBe(true);
            expect(scene.camera).toBeUndefined();
            expect(scene.remove(camera)).toBe(false);
        });

        it("defers assigning a camera without buffers (not initialized yet) to update()", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const m = { ...material(), camera: undefined as unknown };
            new Mesh(framework, scene, m as unknown as IMaterial);
            const camera = { projectionViewBuffer: undefined, positionBuffer: undefined, viewMatrix: {}, updateBuffers: vi.fn() } as unknown as { projectionViewBuffer: unknown; positionBuffer: unknown };
            scene.add(camera as unknown as ICamera);
            expect(scene.camera).toBe(camera);
            expect(m.camera).toBeUndefined();
            camera.projectionViewBuffer = {};
            camera.positionBuffer = {};
            scene.update({} as GameTime);
            expect(m.camera).toBe(camera);
        });

        it("rejects unsupported items", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            expect(() => scene.add({} as never)).toThrow("Scene.add: expected");
            expect(() => scene.remove(42 as never)).toThrow("Scene.remove: expected");
        });
    });
});
