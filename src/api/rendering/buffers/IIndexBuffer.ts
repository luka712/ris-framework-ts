import type { IBuffer } from "./IBuffer.ts";
import {IndexBufferType} from "./IndexBufferType.ts";

/**
 * The index buffer.
 */
export interface IIndexBuffer extends IBuffer {

    /**
     * The type of buffer.
     */
    readonly type: IndexBufferType;

    /**
     * Size of the element.
     *     Usually 2 or 4 bytes depending on the Type property.
     */
    readonly elementByteSize: number;

    /**
     * The count of indices.
     */
    readonly indicesCount: number;

    /** Initialize the index buffer. */
    initialize(): void;

    /**
     * Update the index buffer.
     * @param data - The data to be written to buffer.
     * @param offset - The first index to write, in elements. The data mirrors the buffer, so it is used for both. By default, 0.
     * @param length - The number of indices to write. If 0 or less, everything after the offset is written.
     */
    update(data: Uint16Array | Uint32Array, offset?: number, length?: number): void;
}
