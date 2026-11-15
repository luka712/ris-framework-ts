import type { IDisposable } from "../_export";

/**
 * A command encoder. Recreated each frame for the main encoder; custom encoders are created as needed.
 * @internal
 */
export interface IGpuCommandEncoder extends IDisposable {

    /** The label. */
    readonly label?: string;

    /**
     * Creates the native command encoder, or does nothing if one is already active.
     * Call this again after {@link submit} to reuse the wrapper.
     */
    start(): void;

    /**
     * Finishes the current encoder and submits it to the queue.
     * @throws Error when no encoder is active.
     */
    submit(): void;

    /**
     * Queue item to dispose after command queue is submited.
     * @param disposable The disposable item.
     * @internal 
     */
    queueDispose(disposable: IDisposable) : void;
}
