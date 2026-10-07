import {IVertexBuffer} from "../rendering/buffers/IVertexBuffer";
import {IDisposable} from "../core/IDisposable";
import {IIndexBuffer} from "../rendering/buffers/IIndexBuffer";

/**
 * The mesh interface.
 */
export interface IMesh extends IDisposable {

    /**
     * The positions buffer.
     */
    readonly vertexBuffer?: IVertexBuffer;

    /**
     * The indices buffer.
     */
    readonly indexBuffer?: IIndexBuffer;

}
