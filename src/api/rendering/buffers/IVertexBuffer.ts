import type { IBuffer } from "./IBuffer.ts";

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
     * @param offset - The first element to write, in floats. The data mirrors the buffer, so it is used for both. By default, 0.
     * @param length - The number of floats to write. If 0 or less, everything after the offset is written.
     */
    update(data: Float32Array, offset?: number, length?: number): void;

}
