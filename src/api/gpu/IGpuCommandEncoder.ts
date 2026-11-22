import type { IDisposable, ITexture2D, ITexture2DArray } from "../_export";

/**
 * One side of a texture to texture copy.
 * @public 
 */
export interface ITextureCopyRegion {
    /** The texture. */
    texture: ITexture2D | ITexture2DArray;

    /** The mip level. By default 0. */
    mipLevel?: number;

    /** The first array layer. By default 0. */
    arrayLayer?: number;
}

/**
 * Encodes GPU commands for submission to a command queue.
 *
 * The engine provides its own command encoder for standard rendering operations.
 * This interface provides access to an additional command encoder for specialized
 * scenarios that require encoding and submitting GPU commands independently.
 * 
 * When using the WebGL backend, this interface performs no operations.
 *
 * The encoder can be reused after submission by calling {@link start} again.
 *
 * @internal
 */
export interface IGpuCommandEncoder extends IDisposable {

    /**
     * An optional label used to identify the command encoder during debugging.
     */
    readonly label?: string;

    /**
     * Starts recording GPU commands by creating a native command encoder.
     *
     * If an encoder is already active, this method does nothing.
     * After calling {@link submit}, this method can be called again to begin
     * a new recording session using the same wrapper.
     */
    start(): void;

    /**
     * Finishes recording GPU commands and submits the resulting command buffer
     * to the associated command queue.
     *
     * The encoder must be active when this method is called.
     *
     * @throws {Error} If no command encoder is currently active.
     */
    submit(): void;

    /**
     * Copies a mip level region of one texture into another. The width and height come from the source mip level
     * and must match the destination mip level.
     * @param source The source texture, mip level and first array layer.
     * @param destination The destination texture, mip level and first array layer.
     * @param arrayLayerCount The number of array layers to copy. By default 1.
     */
    copyTextureToTexture(source: ITextureCopyRegion, destination: ITextureCopyRegion, arrayLayerCount?: number): void;

    /**
     * Schedules a disposable resource for disposal after the associated
     * command queue has finished processing its submitted commands.
     *
     * @param disposable The resource to dispose after command execution.
     */
    queueDispose(disposable: IDisposable): void;
}