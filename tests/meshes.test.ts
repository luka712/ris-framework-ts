import { describe, expect, it } from "vitest";
import { vec2 } from "gl-matrix";
import {
    BufferUsage,
    GeometryFormat,
    Mesh,
    QuadMesh,
    Rect,
    State,
    type IFramework,
    type IGeometry,
} from "../src/index.ts";

class InspectableQuad extends QuadMesh {
    public constructor(framework: IFramework, isUpdatable: boolean, scale?: vec2) {
        super(framework, isUpdatable, scale);
    }

    public get bufferUsage(): number {
        return this._bufferUsage;
    }

    public useVertexData(data: number[]): void {
        this._vertexData = data;
    }
}

const framework = {} as IFramework;

describe("Mesh", () => {
    it("starts created and refuses to build buffers without positions", () => {
        const mesh = new Mesh(framework);

        expect(mesh.state).toBe(State.CREATED);
        expect(mesh.positions).toBeUndefined();
        expect(mesh.indices).toBeUndefined();
        expect(() => mesh.applyChanges()).toThrow("Cannot create buffers for a Mesh as Mesh has no positions");
        expect(() => mesh.initialize()).toThrow("Cannot create buffers for a Mesh as Mesh has no positions");
    });

    it("refuses geometry that reports no vertices", () => {
        const mesh = new Mesh(framework);
        const geometry = { vertexCount: 0 } as IGeometry;

        expect(() => mesh.setGeometry(geometry, GeometryFormat.POS3_COLOR4_TEXTURECOORDS2))
            .toThrow("geometry.vertexCount is set");
    });
});

describe("QuadMesh", () => {
    it("builds a unit quad in xy before any buffer upload", () => {
        const mesh = new QuadMesh(framework, false);

        expect(mesh.positions).toEqual([
            -0.5, -0.5, 0,
            -0.5, 0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0,
        ]);
        expect(mesh.colors).toEqual([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
        ]);
        expect(mesh.textureCoords).toEqual([
            0, 1,
            0, 0,
            1, 1,
            1, 0,
        ]);
        expect(mesh.indices).toEqual([
            0, 2, 3,
            3, 1, 0,
        ]);
        expect(mesh.state).toBe(State.CREATED);
    });

    it("scales the quad positions from the center", () => {
        const mesh = new QuadMesh(framework, false, vec2.fromValues(2, 4));

        expect(mesh.positions).toEqual([
            -1, -2, 0,
            -1, 2, 0,
            1, -2, 0,
            1, 2, 0,
        ]);
    });

    it("selects a static or copyable vertex usage and blocks edits on a static quad", () => {
        const fixed = new InspectableQuad(framework, false);
        const updatable = new InspectableQuad(framework, true);

        expect(fixed.bufferUsage).toBe(BufferUsage.VERTEX);
        expect(updatable.bufferUsage).toBe(BufferUsage.VERTEX | BufferUsage.COPY_DST);
        expect(() => fixed.applyChanges()).toThrow("This mesh is not updatable.");
    });

    it("writes texture coordinates in bottom-left, top-left, bottom-right, top-right order", () => {
        const mesh = new InspectableQuad(framework, true);
        const vertexData = new Array<number>(36).fill(0);
        mesh.useVertexData(vertexData);

        mesh.updateTextureCoords(new Rect(0.25, 0.5, 0.5, 0.25));

        expect(vertexData[7]).toBe(0.25);
        expect(vertexData[8]).toBe(0.75);
        expect(vertexData[16]).toBe(0.25);
        expect(vertexData[17]).toBe(0.5);
        expect(vertexData[25]).toBe(0.75);
        expect(vertexData[26]).toBe(0.75);
        expect(vertexData[34]).toBe(0.75);
        expect(vertexData[35]).toBe(0.5);

        const written = new Set([7, 8, 16, 17, 25, 26, 34, 35]);
        vertexData.forEach((value, index) => {
            if (!written.has(index)) {
                expect(value).toBe(0);
            }
        });
    });
});
