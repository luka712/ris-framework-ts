import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentManager } from "../src/api/content/ContentManager.ts";
import { GeometryBuilder } from "../src/api/geometry/GeometryBuilder.ts";
import { GeometryFormat } from "../src/api/geometry/GeometryFormat.ts";
import { MeshFactory } from "../src/api/meshes/MeshFactory.ts";
import { SubMesh } from "../src/api/meshes/SubMesh.ts";
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
        const [first, second] = mesh.subMeshes as SubMesh[];
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

describe("ContentManager.loadMesh", () => {
    afterEach(() => vi.unstubAllGlobals());
    const camera = {} as ICamera;

    it("creates one submesh per material range with unlit materials coloured by Kd", async () => {
        stubFetch();
        const { framework, createUnlitMaterial } = fakeFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);

        const mesh = await content.loadMesh("http://host/cube.obj", camera);
        const subMeshes = mesh.subMeshes as SubMesh[];

        expect(subMeshes.map(s => [s.indexStart, s.indexCount])).toEqual([[0, 3], [3, 6], [9, 3]]);
        // "red" is used twice but gets one material.
        expect(createUnlitMaterial).toHaveBeenCalledTimes(2);
        expect(subMeshes[0].material).toBe(subMeshes[2].material);
        expect(createUnlitMaterial.mock.calls[0][0]).toMatchObject({ camera });
        const colorOf = (s: SubMesh) => [...(s.material as unknown as { diffuseColor: Color }).diffuseColor];
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

        const mesh = await content.loadMesh("http://host/m.obj", camera);

        expect(warn).toHaveBeenCalledOnce();
        expect(createUnlitMaterial).toHaveBeenCalledOnce();
        expect(createUnlitMaterial.mock.calls[0][0]).toMatchObject({ camera });
        const material = mesh.subMeshes![0].material as unknown as { diffuseColor: Color };
        expect([...material.diffuseColor]).toEqual([1, 1, 1, 1]);
        warn.mockRestore();
    });
});
