import type { IGeometry } from "./IGeometry.ts";
import {vec2} from "gl-matrix";

/**
 * The geometry descriptor.
 * @public
 */
export interface GeometryDescriptor {

    /** Positions, 3 per vertex. */
    readonly positions: number[];

    /** Triangle indices, 3 per triangle. Optional for non-indexed geometry. */
    readonly indices?: number[];

    /** Normals, 3 per vertex. */
    readonly normals?: number[];

    /** Texture coordinates, 2 per vertex. */
    readonly textureCoords?: number[];

    /** RGBA colours, 4 per vertex. */
    readonly colors?: number[];
}

/**
 * The geometry builder.
 */
export interface IGeometryBuilder {

/**
 * Creates the geometry of a quad.
 * @param scale - The scale of the quad. If omitted it is set to (1,1).
 * @param counterClockwise - True for counter-clockwise winding (the default), false for clockwise.
 * @returns The geometry.
 */
  quadGeometry(scale?: vec2, counterClockwise?: boolean): IGeometry;
  
/**
 * Creates geometry from a plain descriptor.
 * Attributes a material's geometry format needs but the descriptor lacks are filled with defaults:
 * white colours, zero texture coordinates and zero normals.
 * @param descriptor - The geometry descriptor. Its arrays are copied.
 * @returns The geometry.
 */
  create(descriptor: GeometryDescriptor): IGeometry;
}
