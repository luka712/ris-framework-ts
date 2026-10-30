import type { GeometryFormat } from "../geometry/GeometryFormat.ts";
import type { IGeometry } from "../geometry/IGeometry.ts";
import {QuadMesh} from "./QuadMesh.ts";
import {vec2} from "gl-matrix";
import type { IMesh } from "./IMesh.ts";
import type { IMaterial } from "../material/IMaterial.ts";
import type { IRenderableMesh } from "./IRenderableMesh.ts";

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
     * Creates a plain mesh (buffers only, no material or transform) from a geometry.
     * @param geometry - The geometry.
     * @param geometryFormat - The vertex layout.
     * @returns The mesh.
     */
    createMesh(geometry: IGeometry, geometryFormat: GeometryFormat): IMesh;

    /**
     * Creates a renderable mesh with one material. Add it to a scene with `scene.add(mesh)`.
     * @param geometry - The geometry.
     * @param material - The material.
     * @returns The mesh.
     */
    create(geometry: IGeometry, material: IMaterial): IRenderableMesh;

    /**
     * Creates a mesh made of submeshes that share one vertex and one index buffer.
     * The root mesh has no material; `mesh.render()` draws its submeshes. Add the root to a scene with `scene.add(mesh)`.
     * @param geometry - The geometry.
     * @param subMeshes - One entry per submesh. All materials must use the same geometry format.
     * @returns The mesh.
     */
    createWithSubMeshes(geometry: IGeometry, subMeshes: SubMeshDescriptor[]): IRenderableMesh;

    /**
     * Creates the quad mesh.
     * @param isUpdatable - Should mesh be updated after creation.
     * @param scale - The scale factor for geometry. If null it is set to (1,1).
     * @returns The quad mesh.
     */
    createQuadMesh(isUpdatable: boolean, scale?: vec2): QuadMesh;
}

