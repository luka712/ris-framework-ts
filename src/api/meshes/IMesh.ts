import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IDisposable } from "../core/IDisposable.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IMaterial } from "../material/IMaterial.ts";
import type { mat4, vec3 } from "gl-matrix";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";

/**
 * Represents a mesh containing geometry, material information, and optionally child submeshes.
 * A mesh may contain vertex and index buffers directly, or act as a container for submeshes.
 * @public
 */
export interface IMesh extends IDisposable {

    /** The vertex buffer containing the mesh's vertex data, if any. */
    readonly vertexBuffer?: IVertexBuffer;

    /** The index buffer containing the mesh's index data, if any. */
    readonly indexBuffer?: IIndexBuffer;

    /** The material assigned to this mesh, if any. */
    material?: IMaterial;

    /** First index in {@link indexBuffer} to draw. Undefined draws from 0. */
    readonly indexStart?: number;

    /** Number of indices to draw. Undefined draws the whole index buffer. */
    readonly indexCount?: number;

    /** The child submeshes contained in this mesh, if any. */
    readonly subMeshes?: IMesh[];

    /** World position. Defaults to the origin. In-place edits are detected. */
    position: vec3;

    /**
     * Euler rotation in radians, applied in Y, X, Z order (yaw, pitch, roll): `R = Ry * Rx * Rz`.
     * Defaults to (0, 0, 0). In-place edits are detected.
     */
    rotation: vec3;

    /** Scale. Defaults to (1, 1, 1). In-place edits are detected. */
    scale: vec3;

    /**
     * The model matrix `T * R * S`, recomputed only when position, rotation or scale changed.
     */
    readonly modelMatrix: mat4;

    /**
     * The model buffer (std140 `mat4`) holding {@link modelMatrix}. Owned by the mesh (submeshes share the parent's),
     * uploaded when the transform changed and assigned to the material(s) before drawing.
     * Created on first use.
     */
    readonly modelBuffer: IUniformBuffer;

    /** Render the mesh. */
    render(): void;
}