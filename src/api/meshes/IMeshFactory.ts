import type { IGeometry } from "../geometry/IGeometry.ts";
import {QuadMesh} from "./QuadMesh.ts";
import {vec2} from "gl-matrix";
import type { IMesh } from "./IMesh.ts";
import type { IMaterial } from "../material/IMaterial.ts";

/**
 * The mesh factory.
 */
export interface IMeshFactory {

    /**
     * Creates a mesh.
     * @param geometry - The geometry.
     * @param material - The material.
     * @returns The mesh.
     */
    create(geometry: IGeometry, material: IMaterial): IMesh;

    /**
     * Creates the quad mesh.
     * @param isUpdatable - Should mesh be updated after creation.
     * @param scale - The scale factor for geometry. If null it is set to (1,1).
     * @returns The quad mesh.
     */
    createQuadMesh(isUpdatable: boolean, scale?: vec2): QuadMesh;
}

