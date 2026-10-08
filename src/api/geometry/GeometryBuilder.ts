import { vec2 } from "gl-matrix"
import { BaseGeometry } from "./BaseGeometry.ts";
import type {IGeometry, IGeometryBuilder} from "../index.ts";

/**
 * The GeometryBuilder class provides methods for creating various types of geometries, such as quads, with specified parameters like scale and winding order.
 */
export class GeometryBuilder implements IGeometryBuilder {

    static DEFAULT_SCALE = vec2.fromValues(1,1);

    /** @inheritdoc */
    public quadGeometry(scale?: vec2 | null, counterClockwise: boolean = true): IGeometry {

        scale = scale ?? GeometryBuilder.DEFAULT_SCALE;

        const geometry = new BaseGeometry();
        geometry.vertexCount = 4;
        geometry.positions = [
            -0.5 * scale[0], -0.5 * scale[1], 0.0, // bottom left
            -0.5 * scale[0], 0.5 * scale[1], 0.0, // top left
            0.5 * scale[0], -0.5 * scale[1], 0.0, // bottom right
            0.5 * scale[0], 0.5 * scale[1], 0.0, // top right
        ];
        if (counterClockwise) {
            geometry.indices = [
                    2, 3, 1, // t1
                    1, 0, 2 // t2 
                ];
        }
        else {
            geometry.indices = [
                    1, 3, 2, // t1
                    2, 0, 1 // t2 
                ];
        }
        geometry.colors = [
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1,
                1, 1, 1, 1
            ];
        geometry.textureCoords = [
                0, 1, // bottom left
                0, 0, // top left
                1, 1, // bottom right
                1, 0 // top right
            ];
        geometry.normals =  [
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
                0, 0, 1,
            ];

        return geometry;
    }
}