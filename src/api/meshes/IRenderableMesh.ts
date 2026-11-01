import type { IMesh } from "./IMesh.ts";
import type { IMaterial } from "../material/IMaterial.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import type {ISceneObject} from "../scene/ISceneObject.ts";

/**
 * A mesh that can be drawn: a mesh plus an optional material, an index range and sub meshes.
 *
 * - A root mesh owns the vertex and index buffers. Sub meshes share them and only store their index range.
 * - Rendering: a mesh with a material draws its range, then its sub meshes draw theirs.
 *   A root without a material only draws its sub meshes.
 * - The transform (position, rotation, scale) and the model buffer live on the root and are shared by all sub meshes,
 *   so a mesh uploads its model matrix once per change, whatever the number of materials.
 * - Disposing the root disposes the sub meshes and the buffers once. Materials are not disposed by the mesh
 *   (a `SceneMesh` does that).
 * @public
 */
export interface IRenderableMesh extends IMesh, ISceneObject {

    /** The material, if any. A root mesh made only of sub meshes has none. */
    material?: IMaterial;

    /** The parent for a sub mesh; undefined for a root mesh. */
    readonly parent?: IRenderableMesh;

    /** The sub meshes. */
    readonly subMeshes: readonly IRenderableMesh[];

    /** First index of the range to draw. Defaults to 0. */
    readonly indexStart: number;

    /** Number of indices to draw; -1 (the default) draws all indices. */
    readonly indexCount: number;

    /**
     * The model buffer (std140 `mat4`) holding the root's `transform.modelMatrix`. Owned by the root mesh (sub meshes share it),
     * uploaded when the transform changed and assigned to the material(s) before drawing. Created on first use.
     */
    readonly modelBuffer: IUniformBuffer;

    /** Draws the mesh's range with its material (if any), then the sub meshes. */
    render(): void;
}
