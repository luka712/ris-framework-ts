import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IDisposable } from "../core/IDisposable.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IMaterial } from "../material/IMaterial.ts";

/**
 * The mesh interface.
 * @public
 */
export interface IMesh extends IDisposable {

    /** The positions buffer. */
    readonly vertexBuffer?: IVertexBuffer;

    /**  The indices buffer.*/
    readonly indexBuffer?: IIndexBuffer;

    /** The material. */
    material: IMaterial;
}
