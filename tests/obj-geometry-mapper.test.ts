import { describe, expect, it } from "vitest";
import { ObjLoader } from "../src/api/loaders/obj/index.ts";
import { ObjGeometryMapper } from "../src/api/loaders/ObjGeometryMapper.ts";
import { GeometryBuilder } from "../src/api/geometry/GeometryBuilder.ts";
import { BaseGeometry } from "../src/api/geometry/BaseGeometry.ts";
import { GeometryFormat } from "../src/api/geometry/GeometryFormat.ts";

const definition = new ObjLoader().fromText([
    "v 0 0 0", "v 1 0 0", "v 0 1 0",
    "vt 0 0", "vt 1 0", "vt 0 1",
    "vn 0 0 1",
    "f 1/1/1 2/2/1 3/3/1",
].join("\n"), new ObjLoader().parseMtl("newmtl red\nKd 1 0 0")).geometry;

describe("ObjGeometryMapper", () => {
    it("maps the definition onto a geometry descriptor, white by default", () => {
        const descriptor = ObjGeometryMapper.toDescriptor(definition);

        expect(descriptor.positions).toEqual(definition.positions);
        expect(descriptor.textureCoords).toEqual(definition.textureCoords);
        expect(descriptor.normals).toEqual(definition.normals);
        expect(descriptor.indices).toEqual(definition.indices);
        expect(descriptor.colors).toBeUndefined();
    });

    it("keeps the loader's material colours when asked", () => {
        expect(ObjGeometryMapper.toDescriptor(definition, true).colors).toEqual(definition.colors);
    });
});

describe("GeometryBuilder.create", () => {
    it("creates BaseGeometry from a descriptor, copying arrays and filling missing attributes", () => {
        const positions = [0, 0, 0, 1, 0, 0, 0, 1, 0];
        const geometry = new GeometryBuilder().create({ positions, indices: [0, 1, 2] });

        expect(geometry).toBeInstanceOf(BaseGeometry);
        expect(geometry.positions).toEqual(positions);
        expect(geometry.positions).not.toBe(positions);
        expect(geometry.colors).toEqual(new Array(12).fill(1));
        expect(geometry.textureCoords).toEqual(new Array(6).fill(0));
        expect(geometry.normals).toEqual(new Array(9).fill(0));
    });

    it("interleaves an OBJ descriptor for the unlit material format", () => {
        const data = new GeometryBuilder().create(ObjGeometryMapper.toDescriptor(definition))
            .toInterleaved(GeometryFormat.POS3_COLOR4_TEXTURECOORDS2);
        expect(data.length).toBe(3 * 9);
        expect(data.slice(9, 18)).toEqual([1, 0, 0, 1, 1, 1, 1, 1, 0]);
    });
});
