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
     * Writes data into the buffer's CPU-side copy. Call {@link update} to upload it to the GPU.
     * @param data - The data array.
     * @param offset - The first element to write, in floats. The data mirrors the buffer, so it is used for both. By default, 0.
     * @param length - The number of floats to write. If 0 or less, everything after the offset is written.
     */
    write(data: Float32Array, offset?: number, length?: number): void;

    /**
     * Writes a single value into the buffer's CPU-side copy. Call {@link update} to upload it to the GPU.
     * @param value The value.
     * @param offset The offset.
     */
    writeSingle(value: number, offset: number): void;

    /**
     * Uploads the buffer's CPU-side copy to the GPU.
     * @public
     */
    update(): void;
    
}
