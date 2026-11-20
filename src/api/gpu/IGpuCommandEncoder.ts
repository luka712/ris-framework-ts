import type { IComputePass, IDisposable, IRenderPass } from "../_export";
import type { Stack } from "../data/Stack";

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
     * TODO
     */
    // copyTextureToTexture();

    /**
     * Schedules a disposable resource for disposal after the associated
     * command queue has finished processing its submitted commands.
     *
     * @param disposable The resource to dispose after command execution.
     */
    queueDispose(disposable: IDisposable): void;
}