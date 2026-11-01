import { describe, expect, it, vi } from "vitest";
import { Scene } from "../src/api/scene/Scene.ts";
import { SceneMesh } from "../src/api/scene/SceneMesh.ts";
import { RenderableMesh } from "../src/api/meshes/RenderableMesh.ts";
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
import { PerspectiveCamera } from "../src/api/camera/PerspectiveCamera.ts";
import { SpriteMaterial } from "../src/api/material/SpriteMaterial.ts";

function fakeFramework() {
    const framework = {
        lightsFactory: {
            createAmbientLight: vi.fn((desc: unknown, scene?: Scene) => new AmbientLight(desc as never, scene)),
        },
        geometryBuilder: new GeometryBuilder(),
        bufferFactory: { createVertexBuffer: vi.fn(() => ({ dispose: vi.fn() })), createIndexBuffer: vi.fn(() => ({ dispose: vi.fn() })) },
    } as unknown as IFramework;
    (framework as unknown as { meshFactory: MeshFactory }).meshFactory = new MeshFactory(framework);
    return { framework };
}

const material = () => ({
    geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2,
    beforeRender: vi.fn(),
    renderMesh: vi.fn(),
    dispose: vi.fn(),
}) as unknown as IMaterial & { beforeRender: ReturnType<typeof vi.fn>; renderMesh: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };

const lightsMaterial = () => ({
    ...material(),
    ambientLight: new AmbientLight(),
    directionalLights: [] as DirectionalLight[],
    pointLights: [] as PointLight[],
});

const triangles = () => new GeometryBuilder().create({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2, 2, 1, 0] });

describe("Scene", () => {
    it("creates and registers an active ambient light", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        expect(scene.ambientLights).toEqual([scene.activeAmbientLight]);

        const other = new AmbientLight();
        scene.activeAmbientLight = other;
        expect(scene.ambientLights).toContain(other);
    });

    it("hands its ambient light and its light lists (by reference) to lights materials", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const lit = lightsMaterial();
        const plain = material();
        const mesh = framework.meshFactory.createWithSubMeshes(triangles(), [
            { material: lit as unknown as IMaterial, indexStart: 0, indexCount: 3 },
            { material: plain, indexStart: 3, indexCount: 3 },
        ]);
        scene.add(mesh);
        expect(lit.ambientLight).toBe(scene.activeAmbientLight);
        expect(lit.directionalLights).toBe(scene.directionalLights);
        expect(lit.pointLights).toBe(scene.pointLights);
        expect("pointLights" in plain).toBe(false);

        const lamp = new PointLight(undefined, scene);
        expect(lit.pointLights).toEqual([lamp]);

        const other = new AmbientLight();
        scene.activeAmbientLight = other;
        scene.update({} as GameTime);
        expect(lit.ambientLight).toBe(other);
    });

    it("wraps added meshes in a SceneMesh and render() draws every submesh once", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const a = material();
        const b = material();
        const mesh = framework.meshFactory.createWithSubMeshes(triangles(), [
            { material: a, indexStart: 0, indexCount: 3 },
            { material: b, indexStart: 3, indexCount: 3 },
        ]);
        scene.add(mesh);
        expect(scene.meshes).toEqual([mesh]);
        expect(scene.sceneMeshes[0]).toBeInstanceOf(SceneMesh);
        expect(scene.sceneMeshes[0].mesh).toBe(mesh);

        scene.render();
        expect(a.beforeRender).toHaveBeenCalledOnce();
        expect(a.renderMesh).toHaveBeenCalledWith(mesh.subMeshes[0]);
        expect(b.renderMesh).toHaveBeenCalledWith(mesh.subMeshes[1]);
    });

    it("render() draws a plain renderable mesh with its own material", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const m = material();
        const mesh = framework.meshFactory.create(triangles(), m);
        scene.add(new SceneMesh(mesh));

        scene.render();
        expect(m.beforeRender).toHaveBeenCalledOnce();
        expect(m.renderMesh).toHaveBeenCalledWith(mesh);
    });

    it("dispose() disposes each scene mesh once: the mesh and each distinct material", () => {
        const { framework } = fakeFramework();
        const scene = new Scene(framework);
        const shared = material();
        const mesh = framework.meshFactory.createWithSubMeshes(triangles(), [
            { material: shared, indexStart: 0, indexCount: 3 },
            { material: shared, indexStart: 3, indexCount: 3 },
        ]);
        scene.add(mesh);
        const dispose = vi.spyOn(mesh, "dispose");

        scene.dispose();
        scene.dispose();
        expect(dispose).toHaveBeenCalledOnce();
        expect(shared.dispose).toHaveBeenCalledOnce();
        expect(scene.meshes).toEqual([]);
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
        scene.add(framework.meshFactory.create(geometry, own));
        scene.add(framework.meshFactory.createWithSubMeshes(geometry, [
            { material: a, indexStart: 0, indexCount: 3 },
            { material: b, indexStart: 3, indexCount: 3 },
        ]));
        scene.add(framework.meshFactory.create(geometry, noCamera));

        scene.update({} as GameTime);
        expect(sets).toBe(0);

        const camera = { projectionViewBuffer: {}, positionBuffer: {} } as unknown as ICamera;
        scene.camera = camera;
        scene.update({} as GameTime);
        expect([own.camera, a.camera, b.camera]).toEqual([camera, camera, camera]);
        // Every material gets the camera now (no type guard); a plain material just stores it.
        expect((noCamera as { camera?: ICamera }).camera).toBe(camera);
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
            const mesh = new RenderableMesh(framework, m as unknown as IMaterial);
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

        it("directional and point lights go to the scene lists, once, up to 3 and 5", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const sun = new DirectionalLight();
            const lamp = new PointLight();
            scene.add(sun);
            scene.add(sun);
            scene.add(lamp);
            expect(scene.directionalLights).toEqual([sun]);
            expect(scene.pointLights).toEqual([lamp]);
            expect(scene.remove(sun)).toBe(true);
            expect(scene.remove(sun)).toBe(false);
            expect(scene.directionalLights).toEqual([]);
            for (let i = 0; i < 4; i++) new PointLight(undefined, scene);
            expect(() => new PointLight(undefined, scene)).toThrow(/all 5 point light slots are in use/);
            new DirectionalLight(undefined, scene); new DirectionalLight(undefined, scene); new DirectionalLight(undefined, scene);
            expect(() => scene.add(new DirectionalLight())).toThrow(/all 3 directional light slots/);
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

        it("adds a camera to nodes (it is a scene object), updates its transform and removes it", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const camera = new PerspectiveCamera({} as IFramework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100 }, scene);
            expect(scene.camera).toBe(camera);
            expect(scene.nodes).toContain(camera);
            scene.add(camera);
            expect(scene.nodes.filter(n => n === camera)).toHaveLength(1);
            camera.transform.position[0] = 5;
            scene.update({} as GameTime);
            expect(camera.transform.modelMatrix[12]).toBe(5);
            expect(scene.remove(camera)).toBe(true);
            expect(scene.nodes).not.toContain(camera);
            expect(scene.camera).toBeUndefined();
        });

        it("adds lights to nodes (they are scene objects) and removes them", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            expect(scene.nodes).toContain(scene.activeAmbientLight);
            const point = new PointLight({ position: [1, 2, 3] }, scene);
            const sun = new DirectionalLight(undefined, scene);
            scene.addLight(point);
            expect(scene.nodes.filter(n => n === point)).toHaveLength(1);
            expect(scene.nodes).toContain(sun);
            expect(scene.remove(point)).toBe(true);
            expect(scene.nodes).not.toContain(point);
            expect(scene.pointLights).not.toContain(point);
        });

        it("assigns the camera to every material, including ones without camera buffers", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const pipeline = { geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2, textureSampler: undefined, spriteTexture: undefined };
            const createSpriteRenderPipeline = vi.fn(() => pipeline);
            const sprite = new SpriteMaterial({ renderPipelineFactory: { createSpriteRenderPipeline } } as unknown as IFramework,
                { projectionViewBuffer: {}, texture: {}, sampler: {} } as never);
            const plain = material();
            scene.add(new RenderableMesh(framework, sprite));
            scene.add(new RenderableMesh(framework, plain));
            const camera = { projectionViewBuffer: {}, positionBuffer: {}, viewMatrix: {}, updateBuffers: vi.fn() } as unknown as ICamera;
            scene.camera = camera;
            scene.update({} as GameTime);
            // The sprite only stores the camera: no pipeline changes, no buffer access.
            expect(sprite.camera).toBe(camera);
            expect(createSpriteRenderPipeline).toHaveBeenCalledOnce();
            expect(pipeline.textureSampler).toEqual({});
            expect(plain.camera).toBe(camera);
        });

        it("defers assigning a camera without buffers (not initialized yet) to update()", () => {
            const { framework } = fakeFramework();
            const scene = new Scene(framework);
            const m = { ...material(), camera: undefined as unknown };
            scene.add(new RenderableMesh(framework, m as unknown as IMaterial));
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
