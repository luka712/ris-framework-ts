import { describe, expect, it } from "vitest";
import { GeometryFormat, GeometryUtilities } from "../src/index.ts";

describe("GeometryUtilities", () => {
    it("returns the byte stride of an interleaved position, color, and uv vertex", () => {
        expect(GeometryUtilities.stride(GeometryFormat.POS3_COLOR4_TEXTURECOORDS2))
            .toBe(9 * Float32Array.BYTES_PER_ELEMENT);
    });

    it("throws for geometry formats that have no stride", () => {
        const unsupported = [
            GeometryFormat.POS3_COLOR4,
            GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_ALIGNED,
            GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3,
            GeometryFormat.POS3_TEXTURECOORDS2,
        ];

        for (const format of unsupported) {
            expect(() => GeometryUtilities.stride(format)).toThrow("Unknown geometryFormat");
        }

        expect(() => GeometryUtilities.stride(99 as GeometryFormat)).toThrow("Unknown geometryFormat");
    });
});
