import {BufferUsage} from "./BufferUsage";
import {IDisposable} from "../../core/IDisposable";
import {IBuffer} from "./IBuffer";

/**
 * Create a new vertex buffer.
 */
export interface IVertexBuffer extends IBuffer  {


    /**
     * The number of vertices.
     */
    readonly vertexCount: number;

    /**
     * The byte stride of the buffer.
     */
    readonly byteStride: number;

    /**
     * Initialize the vertex buffer.
     */
    initialize(): void;

    /**
     * Update the vertex buffer.
     * @param data - The data to be written to buffer.
     * @param offset - The offset to write data. By default, 0. This is in bytes of the buffer.
     * @param length - The length to copy. If 0 or less, entire array is copied.
     */
    update(data: number[], offset?: number, length?: number): void;

}
