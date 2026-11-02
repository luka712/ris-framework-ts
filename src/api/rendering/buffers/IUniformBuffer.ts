import type { IBuffer } from "./IBuffer.ts";

/**
 * Interface for uniform buffer.
 */
export interface IUniformBuffer extends IBuffer  {

    /**
     * Initialize the constant buffer.
     */
    initialize(): void;

    /**
     * Update the constant buffer.
     * @param data - The data array.
     * @param offset - The first element to write, in floats. The data mirrors the buffer, so it is used for both. By default, 0.
     * @param length - The number of floats to write. If 0 or less, everything after the offset is written.
     */
    update(data: Float32Array, offset?: number, length?: number): void;

}
