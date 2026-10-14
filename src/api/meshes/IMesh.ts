import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IDisposable } from "../core/IDisposable.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IMaterial } from "../material/IMaterial.ts";

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
}