import type { IGeometry } from "./IGeometry.ts";
import {vec2} from "gl-matrix";

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

}
