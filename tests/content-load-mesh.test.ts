import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentManager } from "../src/api/content/ContentManager.ts";
import { GeometryBuilder } from "../src/api/geometry/GeometryBuilder.ts";
import { GeometryFormat } from "../src/api/geometry/GeometryFormat.ts";
import { MeshFactory } from "../src/api/meshes/MeshFactory.ts";
import type { IRenderableMesh } from "../src/api/meshes/IRenderableMesh.ts";
import { ObjLoader } from "../src/api/loaders/ObjLoader.ts";
import { Color } from "../src/api/data/Color.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import type { ICamera } from "../src/api/camera/ICamera.ts";
import type { IMaterial } from "../src/api/material/IMaterial.ts";
import type { IShaderModuleLoader } from "../src/api/shader/IShaderModuleLoader.ts";

const objText = [
    "mtllib cube.mtl",
    "v 0 0 0", "v 1 0 0", "v 0 1 0", "v 1 1 0",
    "usemtl red", "f 1 2 3",
    "usemtl blue", "f 2 4 3", "f 1 2 4",
    "usemtl red", "f 1 3 4",
].join("\n");
const mtlText = "newmtl red\nKd 1 0 0\nnewmtl blue\nKd 0 0 1\nd 0.5";

function stubFetch() {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
        if (url == "http://host/cube.obj") return new Response(objText);
        if (url == "http://host/cube.mtl") return new Response(mtlText);
        return new Response("", { status: 404 });
    }));
}

function fakeFramework() {
    const vertexBuffer = { dispose: vi.fn() };
    const indexBuffer = { dispose: vi.fn() };
    const createUnlitMaterial = vi.fn((descriptor: unknown) => ({
        descriptor,
        geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2,
        diffuseColor: Color.white(),
    }));
    const framework = {
        geometryBuilder: new GeometryBuilder(),
        materialFactory: { createUnlitMaterial },
        bufferFactory: {
            createVertexBuffer: vi.fn(() => vertexBuffer),
            createIndexBuffer: vi.fn(() => indexBuffer),
        },
    } as unknown as IFramework;
    (framework as unknown as { meshFactory: MeshFactory }).meshFactory = new MeshFactory(framework);
    (framework as unknown as { objLoader: ObjLoader }).objLoader = new ObjLoader(framework);
    return { framework, createUnlitMaterial, vertexBuffer, indexBuffer };
}

describe("Mesh submeshes", () => {
    it("share the parent's buffers and carry their own range and material", () => {
        const { framework, vertexBuffer, indexBuffer } = fakeFramework();
        const a = { geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2 } as IMaterial;
        const b = { geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2 } as IMaterial;
        const geometry = new GeometryBuilder().create({ positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2, 2, 1, 0] });

        const mesh = framework.meshFactory.createWithSubMeshes(geometry, [
            { material: a, indexStart: 0, indexCount: 3 },
            { material: b, indexStart: 3, indexCount: 3 },
        ]);

        expect(mesh.material).toBeUndefined();
        expect(mesh.subMeshes).toHaveLength(2);
        const [first, second] = mesh.subMeshes as IRenderableMesh[];
        expect(first.vertexBuffer).toBe(vertexBuffer);
        expect(second.indexBuffer).toBe(indexBuffer);
        expect([second.material, second.indexStart, second.indexCount]).toEqual([b, 3, 3]);
    });

    it("rejects materials with different geometry formats", () => {
        const { framework } = fakeFramework();
        const geometry = new GeometryBuilder().create({ positions: [0, 0, 0], indices: [0] });
        expect(() => framework.meshFactory.createWithSubMeshes(geometry, [
            { material: { geometryFormat: GeometryFormat.POS3_COLOR4 } as IMaterial, indexStart: 0, indexCount: 1 },
            { material: { geometryFormat: GeometryFormat.POS3_TEXTURECOORDS2 } as IMaterial, indexStart: 0, indexCount: 1 },
        ])).toThrow("same geometry format");
    });
});

describe("ContentManager.loadUnlitMeshAsync", () => {
    afterEach(() => vi.unstubAllGlobals());
    const camera = { projectionViewBuffer: { id: "pv" }, positionBuffer: { id: "pos" } } as unknown as ICamera;

    it("creates one submesh per material range with unlit materials coloured by Kd", async () => {
        stubFetch();
        const { framework, createUnlitMaterial } = fakeFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);

        const mesh = await content.loadUnlitMeshAsync("http://host/cube.obj", camera);
        const subMeshes = mesh.subMeshes as IRenderableMesh[];

        expect(subMeshes.map(s => [s.indexStart, s.indexCount])).toEqual([[0, 3], [3, 6], [9, 3]]);
        // "red" is used twice but gets one material.
        expect(createUnlitMaterial).toHaveBeenCalledTimes(2);
        expect(subMeshes[0].material).toBe(subMeshes[2].material);
        expect(createUnlitMaterial.mock.calls[0][0]).toMatchObject({ camera });
        const colorOf = (s: IRenderableMesh) => [...(s.material as unknown as { diffuseColor: Color }).diffuseColor];
        expect(colorOf(subMeshes[0])).toEqual([1, 0, 0, 1]);
        expect(colorOf(subMeshes[1])).toEqual([0, 0, 1, 0.5]);
    });

    it("falls back to a white unlit material when the .mtl is missing", async () => {
        vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith(".obj")
            ? new Response("mtllib gone.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl red\nf 1 2 3")
            : new Response("", { status: 404 })));
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { framework, createUnlitMaterial } = fakeFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);

        const mesh = await content.loadUnlitMeshAsync("http://host/m.obj", camera);

        expect(warn).toHaveBeenCalledOnce();
        expect(createUnlitMaterial).toHaveBeenCalledOnce();
        expect(createUnlitMaterial.mock.calls[0][0]).toMatchObject({ camera });
        const material = mesh.subMeshes![0].material as unknown as { diffuseColor: Color };
        expect([...material.diffuseColor]).toEqual([1, 1, 1, 1]);
        warn.mockRestore();
    });
});

describe("ContentManager.loadBlinnPhongMeshAsync", () => {
    afterEach(() => vi.unstubAllGlobals());
    const cameraWithBuffers = { projectionViewBuffer: { id: "pv" }, positionBuffer: { id: "pos" } } as unknown as ICamera;
    const buffers = { projectionViewBuffer: cameraWithBuffers.projectionViewBuffer, cameraPositionBuffer: cameraWithBuffers.positionBuffer };

    function blinnPhongFramework() {
        const result = fakeFramework();
        const createForwardBlinnPhongMaterial = vi.fn((descriptor: unknown) => ({
            descriptor,
            geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3,
            ambientColor: new Color(0.1, 0.1, 0.1),
            diffuseColor: new Color(0.8, 0.8, 0.8),
            specularColor: new Color(0.5, 0.5, 0.5),
            shininess: 32,
        }));
        (result.framework.materialFactory as unknown as { createForwardBlinnPhongMaterial: unknown }).createForwardBlinnPhongMaterial = createForwardBlinnPhongMaterial;
        return { ...result, createForwardBlinnPhongMaterial };
    }
    type Lit = { descriptor: unknown; ambientColor: Color; diffuseColor: Color; specularColor: Color; shininess: number };
    const lit = (s: IRenderableMesh) => s.material as unknown as Lit;

    it("creates one submesh per range, shares materials per name and maps Ka/Kd/Ks/Ns", async () => {
        const mtl = "newmtl red\nKa 0.2 0 0\nKd 1 0 0\nKs 0.9 0.8 0.7\nNs 64\nnewmtl blue\nKd 0 0 1\nd 0.5";
        vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith(".obj") ? new Response(objText) : new Response(mtl)));
        const { framework, createUnlitMaterial, createForwardBlinnPhongMaterial } = blinnPhongFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);

        const mesh = await content.loadBlinnPhongMeshAsync("http://host/cube.obj", cameraWithBuffers);
        const subMeshes = mesh.subMeshes as IRenderableMesh[];

        expect(subMeshes.map(s => [s.indexStart, s.indexCount])).toEqual([[0, 3], [3, 6], [9, 3]]);
        expect(createUnlitMaterial).not.toHaveBeenCalled();
        expect(createForwardBlinnPhongMaterial).toHaveBeenCalledTimes(2);
        expect(subMeshes[0].material).toBe(subMeshes[2].material);
        expect(createForwardBlinnPhongMaterial.mock.calls[0][0]).toEqual(buffers);

        const red = lit(subMeshes[0]);
        expect([...red.ambientColor]).toEqual([expect.closeTo(0.2, 6), 0, 0, 1]);
        expect([...red.diffuseColor]).toEqual([1, 0, 0, 1]);
        expect([...red.specularColor].map(v => Number(v.toFixed(6)))).toEqual([0.9, 0.8, 0.7, 1]);
        expect(red.shininess).toBe(64);

        // No Ka, Ks or Ns: ambient falls back to Kd, specular and shininess keep the material defaults.
        const blue = lit(subMeshes[1]);
        expect([...blue.diffuseColor]).toEqual([0, 0, 1, 0.5]);
        expect([...blue.ambientColor]).toEqual([0, 0, 1, 1]);
        expect([...blue.specularColor]).toEqual([0.5, 0.5, 0.5, 1]);
        expect(blue.shininess).toBe(32);
    });

    it("falls back to white Blinn-Phong defaults without an .mtl", async () => {
        vi.stubGlobal("fetch", vi.fn(async (url: string) => url.endsWith(".obj")
            ? new Response("mtllib gone.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl red\nf 1 2 3")
            : new Response("", { status: 404 })));
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { framework, createForwardBlinnPhongMaterial } = blinnPhongFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);

        const mesh = await content.loadBlinnPhongMeshAsync("http://host/m.obj", cameraWithBuffers);

        expect(warn).toHaveBeenCalledOnce();
        expect(createForwardBlinnPhongMaterial).toHaveBeenCalledOnce();
        expect(createForwardBlinnPhongMaterial.mock.calls[0][0]).toEqual(buffers);
        const material = lit(mesh.subMeshes![0] );
        expect([...material.diffuseColor]).toEqual([1, 1, 1, 1]);
        expect([...material.ambientColor]).toEqual([1, 1, 1, 1]);
        expect([...material.specularColor]).toEqual([0.5, 0.5, 0.5, 1]);
        expect(material.shininess).toBe(32);
        warn.mockRestore();
    });

    it("throws a clear error before fetching when the camera has no buffers", async () => {
        const fetch = vi.fn(async () => new Response(objText));
        vi.stubGlobal("fetch", fetch);
        const { framework } = blinnPhongFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);

        expect(() => content.loadBlinnPhongMeshAsync("http://host/cube.obj", undefined as unknown as ICamera))
            .toThrow("the camera has no projectionViewBuffer/positionBuffer");
        const noPosition = { projectionViewBuffer: { id: "pv" } } as unknown as ICamera;
        expect(() => content.loadBlinnPhongMeshAsync("http://host/cube.obj", noPosition)).toThrow("positionBuffer");
        await expect(framework.objLoader.loadAsync("http://host/cube.obj", { projectionViewBuffer: {} } as never))
            .rejects.toThrow("needs projectionViewBuffer and cameraPositionBuffer");
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("ObjLoader", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("parseAsync returns an ObjModel with sub meshes and resolved materials, without GPU resources", async () => {
        stubFetch();
        const model = await ObjLoader.parseAsync("http://host/cube.obj");
        expect(model.subMeshes.map(s => [s.materialName, s.indexStart, s.indexCount])).toEqual([["red", 0, 3], ["blue", 3, 6], ["red", 9, 3]]);
        expect(model.subMeshes[1].material?.opacity).toBe(0.5);
        expect(model.materials.map(m => m.name)).toEqual(["red", "blue"]);
    });

    it("loadAsync with a factory: a root without material, one sub mesh per range, shared buffers, white vertex colours", async () => {
        stubFetch();
        const { framework, vertexBuffer } = fakeFramework();
        const factory = vi.fn(() => ({ geometryFormat: GeometryFormat.POS3_COLOR4_TEXTURECOORDS2 }) as IMaterial);
        const mesh = await framework.objLoader.loadAsync("http://host/cube.obj", factory);
        expect(mesh.material).toBeUndefined();
        expect(mesh.subMeshes).toHaveLength(3);
        expect(factory).toHaveBeenCalledTimes(2);
        expect(mesh.subMeshes[0].material).toBe(mesh.subMeshes[2].material);
        expect(mesh.subMeshes[1].vertexBuffer).toBe(vertexBuffer);
        const data = (framework.bufferFactory.createVertexBuffer as ReturnType<typeof vi.fn>).mock.calls[0][0] as number[];
        // POS3 COLOR4 UV2: the colour of the first vertex is white.
        expect(Array.from(data).slice(3, 7)).toEqual([1, 1, 1, 1]);
    });

    it("loadMeshAsync returns a plain mesh with buffers only", async () => {
        stubFetch();
        const { framework, vertexBuffer } = fakeFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);
        const mesh = await content.loadMeshAsync("http://host/cube.obj", GeometryFormat.POS3_COLOR4_TEXTURECOORDS2);
        expect(mesh.vertexBuffer).toBe(vertexBuffer);
        expect("material" in mesh).toBe(false);
        expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0])).toEqual(["http://host/cube.obj"]);
    });
});
