import {IBuffer} from "./IBuffer";
import {IndexBufferType} from "./IndexBufferType";

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

    /**
     * Initialize the index buffer.
     * @param data - The data to initialize with.
     */
    initialize(data: number[]): void;

    /**
     * Initialize the index buffer.
     * @param data - The data to initialize with.
     */
    initialize(data: number[]): void;

}
