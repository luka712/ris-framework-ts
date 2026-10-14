import { afterEach, describe, expect, it, vi } from "vitest";
import { ObjLoader } from "../src/api/loaders/obj/index.ts";

const triangleObj = [
    "# comment and blank lines are ignored",
    "",
    "v 0 0 0",
    "v 1 0 0",
    "v 0 1 0",
    "vt 0 0",
    "vt 1 0",
    "vt 0.5 1",
    "vn 0 0 1",
    "vn 0 1 0",
    "f 1/1/1 2/2/1 3/3/2",
].join("\n");

const mtlText = [
    "# two materials",
    "newmtl red",
    "Ka 0.1 0.1 0.1",
    "Kd 1 0 0",
    "Ks 0.5 0.5 0.5",
    "Ns 32",
    "d 0.5",
    "illum 2",
    "map_Kd textures/red.png",
    "map_Bump -bm 0.5 textures/red_n.png",
    "",
    "newmtl blue",
    "Kd 0 0 1",
    "Tr 0.25",
    "map_Ks spec.png",
].join("\n");

describe("ObjLoader", () => {
    it("returns plain objects and arrays only", () => {
        const { geometry } = new ObjLoader().fromText(triangleObj);
        expect(Object.getPrototypeOf(geometry)).toBe(Object.prototype);
        expect(Array.isArray(geometry.positions)).toBe(true);
        expect(JSON.parse(JSON.stringify(geometry))).toEqual(geometry);
    });

    afterEach(() => vi.unstubAllGlobals());

    it("keeps the raw OBJ lists and face triplets", () => {
        const { raw } = new ObjLoader().fromText(triangleObj);

        expect(raw.positions).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(raw.textureCoords).toEqual([0, 0, 1, 0, 0.5, 1]);
        expect(raw.normals).toEqual([0, 0, 1, 0, 1, 0]);
        expect(raw.faceIndices).toEqual([0, 0, 0, 1, 1, 0, 2, 2, 1]);
    });

    it("expands corners into renderable per-vertex geometry", () => {
        const { geometry, materials } = new ObjLoader().fromText(triangleObj);

        expect(geometry.positions).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        expect(geometry.textureCoords).toEqual([0, 0, 1, 0, 0.5, 1]);
        expect(geometry.normals).toEqual([0, 0, 1, 0, 0, 1, 0, 1, 0]);
        expect(geometry.colors).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        expect(geometry.indices).toEqual([0, 1, 2]);
        expect(geometry.vertexCount).toBe(3);
        expect(geometry.materialRanges).toEqual([{ materialName: undefined, indexStart: 0, indexCount: 3 }]);
        expect(materials).toEqual([]);
    });

    it("reuses shared corners and triangulates quads, with v//vn and negative indices", () => {
        const { geometry } = new ObjLoader().fromText([
            "v 0 0 0", "v 1 0 0", "v 1 1 0", "v 0 1 0",
            "vn 0 0 1",
            "f 1//1 2//1 3//1 4//1",
            "f -4//-1 -2//-1 -1//-1",
        ].join("\n"));

        expect(geometry.positions.length / 3).toBe(4);
        expect(geometry.indices).toEqual([0, 1, 2, 0, 2, 3, 0, 2, 3]);
        expect(geometry.textureCoords).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("parses mtl definitions", () => {
        const [red, blue] = new ObjLoader().parseMtl(mtlText);

        expect(red.name).toBe("red");
        expect(red.ambientColor).toEqual([0.1, 0.1, 0.1]);
        expect(red.diffuseColor).toEqual([1, 0, 0]);
        expect(red.specularColor).toEqual([0.5, 0.5, 0.5]);
        expect(red.specularExponent).toBe(32);
        expect(red.opacity).toBe(0.5);
        expect(red.illuminationModel).toBe(2);
        expect(red.maps).toEqual({ map_Kd: "textures/red.png", map_Bump: "textures/red_n.png" });
        expect(red.mapOptions).toEqual({ map_Bump: "-bm 0.5" });

        expect(blue.diffuseColor).toEqual([0, 0, 1]);
        expect(blue.opacity).toBe(0.75);
        expect(blue.maps).toEqual({ map_Ks: "spec.png" });
    });

    it("applies usemtl colours and records material ranges and libraries", () => {
        const loader = new ObjLoader();
        const result = loader.fromText([
            "mtllib colors.mtl",
            "v 0 0 0", "v 1 0 0", "v 0 1 0",
            "usemtl red",
            "f 1 2 3",
            "usemtl blue",
            "f 1 2 3",
        ].join("\n"), loader.parseMtl(mtlText));

        expect(result.materialLibraries).toEqual(["colors.mtl"]);
        expect(result.materials.map(m => m.name)).toEqual(["red", "blue"]);
        expect(result.geometry.materialRanges).toEqual([
            { materialName: "red", indexStart: 0, indexCount: 3 },
            { materialName: "blue", indexStart: 3, indexCount: 3 },
        ]);
        // Same positions, different material: separate vertices.
        expect(result.geometry.indices).toEqual([0, 1, 2, 3, 4, 5]);
        expect(result.geometry.colors.slice(0, 4)).toEqual([1, 0, 0, 0.5]);
        expect(result.geometry.colors.slice(12, 16)).toEqual([0, 0, 1, 0.75]);
    });

    it("loadAsync fetches the mtl relative to the obj", async () => {
        const fetchMock = vi.fn(async (url: string) => {
            if (url == "http://host/models/cube.obj") {
                return new Response("mtllib cube.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl red\nf 1 2 3");
            }
            if (url == "http://host/models/cube.mtl") {
                return new Response(mtlText);
            }
            return new Response("", { status: 404 });
        });
        vi.stubGlobal("fetch", fetchMock);

        const result = await new ObjLoader().loadAsync("http://host/models/cube.obj");

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(result.materials.map(m => m.name)).toEqual(["red", "blue"]);
        expect(result.geometry.colors.slice(0, 4)).toEqual([1, 0, 0, 0.5]);
    });

    it("loadAsync survives a missing mtl", async () => {
        const fetchMock = vi.fn(async (url: string) => url == "http://host/models/m.obj"
            ? new Response("mtllib missing.mtl\nv 0 0 0\nv 1 0 0\nv 0 1 0\nusemtl red\nf 1 2 3")
            : new Response("", { status: 404 }));
        vi.stubGlobal("fetch", fetchMock);
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

        const result = await new ObjLoader().loadAsync("http://host/models/m.obj");

        expect(fetchMock).toHaveBeenCalledWith("http://host/models/missing.mtl");
        expect(warn).toHaveBeenCalledOnce();
        expect(result.materials).toEqual([]);
        expect(result.materialLibraries).toEqual(["missing.mtl"]);
        expect(result.geometry.colors).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        warn.mockRestore();
    });
});
