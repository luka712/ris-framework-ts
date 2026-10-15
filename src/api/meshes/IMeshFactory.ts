import type { IGeometry } from "../geometry/IGeometry.ts";
import {QuadMesh} from "./QuadMesh.ts";
import {vec2} from "gl-matrix";
import type { IMesh } from "./IMesh.ts";
import type { IMaterial } from "../material/IMaterial.ts";
import type { Scene } from "../scene/Scene.ts";

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
     * Creates a mesh and adds it to the scene.
     * @param scene - The scene the mesh adds itself to.
     * @param geometry - The geometry.
     * @param material - The material.
     * @returns The mesh.
     */
    create(scene: Scene, geometry: IGeometry, material: IMaterial): IMesh;

    /**
     * Creates a mesh made of submeshes that share one vertex and one index buffer.
     * The mesh itself has no material; `scene.render()` (or `mesh.render()`) draws its submeshes.
     * Only the mesh is added to the scene, not the submeshes.
     * @param scene - The scene the mesh adds itself to.
     * @param geometry - The geometry.
     * @param subMeshes - One entry per submesh. All materials must use the same geometry format.
     * @returns The mesh.
     */
    createWithSubMeshes(scene: Scene, geometry: IGeometry, subMeshes: SubMeshDescriptor[]): IMesh;

    /**
     * Creates the quad mesh.
     * @param isUpdatable - Should mesh be updated after creation.
     * @param scale - The scale factor for geometry. If null it is set to (1,1).
     * @returns The quad mesh.
     */
    createQuadMesh(isUpdatable: boolean, scale?: vec2): QuadMesh;
}

