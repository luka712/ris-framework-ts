import type { IGeometry } from "../geometry/IGeometry.ts";
import {QuadMesh} from "./QuadMesh.ts";
import {vec2} from "gl-matrix";
import type { IMesh } from "./IMesh.ts";
import type { IMaterial } from "../material/IMaterial.ts";

/** Describes one submesh: a material and the index range it draws. */
export interface SubMeshDescriptor {
    /** The material. */
    readonly material: IMaterial;
    /** The first index of the range. */
    readonly indexStart: number;
    /** The number of indices in the range. */
    readonly indexCount: number;
}

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
     * Creates a mesh made of submeshes that share one vertex and one index buffer.
     * The mesh itself has no material; draw it through `mesh.subMeshes`.
     * @param geometry - The geometry.
     * @param subMeshes - One entry per submesh. All materials must use the same geometry format.
     * @returns The mesh.
     */
    createWithSubMeshes(geometry: IGeometry, subMeshes: SubMeshDescriptor[]): IMesh;

    /**
     * Creates the quad mesh.
     * @param isUpdatable - Should mesh be updated after creation.
     * @param scale - The scale factor for geometry. If null it is set to (1,1).
     * @returns The quad mesh.
     */
    createQuadMesh(isUpdatable: boolean, scale?: vec2): QuadMesh;
}

