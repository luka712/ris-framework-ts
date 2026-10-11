import { describe, expect, it } from "vitest";
import { ObjLoader } from "../src/api/loaders/ObjLoader.ts";

describe("ObjLoader", () => {
    it("loads positions, texture coordinates, normals, and face indices from text", () => {
        const geometry = new ObjLoader().fromText([
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
        ].join("\n"));

        expect(geometry.positions).toEqual([
            0, 0, 0,
            1, 0, 0,
            0, 1, 0,
        ]);
        expect(geometry.textureCoords).toEqual([
            0, 0,
            1, 0,
            0.5, 1,
        ]);
        expect(geometry.normals).toEqual([
            0, 0, 1,
            0, 1, 0,
        ]);
        expect(geometry.indices).toEqual([
            0, 0, 0,
            1, 1, 0,
            2, 2, 1,
        ]);
        expect(geometry.vertexCount).toBe(3);
        expect(geometry.colors).toBeUndefined();
    });
});
