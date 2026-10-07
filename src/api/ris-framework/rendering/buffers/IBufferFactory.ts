import {IIndexBuffer} from "./IIndexBuffer";
import {BufferUsage} from "./BufferUsage";
import {IUniformBuffer} from "./IUniformBuffer";
import {IVertexBuffer} from "./IVertexBuffer";

/**
 * The buffer factory interface.
 */
export interface IBufferFactory {

    /**
     * Creates a new index buffer and prefills it with data.
     * @param data - The data to prefill the buffer with.
     * @param label - The buffer label.
     * @returns The index buffer.
     */
    createIndexBuffer(data: ArrayLike<number>, label?: string): IIndexBuffer;

    /**
     * Creates a new vertex buffer and prefills it with data.
     * @param data - The data to prefill the buffer with.
     * @param vertexStride - The stride of single vertex in bytes.
     * @param usage - The buffer usage.
     * @param label - The buffer label.
     * @returns The vertex buffer.
     */
    createVertexBuffer(data: ArrayLike<number>, vertexStride: number, usage?: BufferUsage, label?: string): IVertexBuffer;

    /**
     * Creates a new uniform buffer.
     * @param data - The data to fill buffer with.
     * @param usage - The buffer usage.
     * @param label - The optional label of the buffer.
     * @returns The uniform buffer.
     */
    createUniformBuffer(data: ArrayLike<number>, usage?: BufferUsage, label?: string): IUniformBuffer;

}
