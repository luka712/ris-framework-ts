import type { IGeometry } from "../geometry/IGeometry.ts";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import {QuadMesh} from "./QuadMesh.ts";
import {vec2} from "gl-matrix";
import type { IMesh } from "./IMesh.ts";

/**
 * The mesh factory.
 */
export interface IMeshFactory {

    /**
     * Creates a mesh.
     * @param geometry - The geometry.
     * @param geometryFormat - The geometry format.
     * @returns The mesh.
     */
    create(geometry: IGeometry, geometryFormat: GeometryFormat): IMesh;

    /**
     * Creates the quad mesh.
     * @param isUpdatable - Should mesh be updated after creation.
     * @param scale - The scale factor for geometry. If null it is set to (1,1).
     * @returns The quad mesh.
     */
    createQuadMesh(isUpdatable: boolean, scale?: vec2): QuadMesh;
}

