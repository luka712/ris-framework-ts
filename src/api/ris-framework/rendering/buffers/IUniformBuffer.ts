import {IBuffer} from "./IBuffer";

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
     * @param offset - Defines where to start buffer write. Must be in bytes.
     * @param length - Defines how many bytes to write. By default, -1 that means data length is used.
     */
    update(data: ArrayLike<number>, offset?: number, length?: number): void;

}
