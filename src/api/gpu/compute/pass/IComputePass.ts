import type { IDisposable } from "../../../core/IDisposable.ts";

/**
 * A compute pass.
 * @public
 */
export interface IComputePass extends IDisposable {

    /**
     * The label of this compute pass.
     * @public
     */
    label?: string;

    /**
     * Whether the pass is currently open.
     * @internal
     * @ai-generated
     */
    readonly isOpen: boolean;

    /**
     * Begins the compute pass.
     * @public
     * @throws Error when the pass is already open.
     */
    beginPass(): void;

    /**
     * Ends the compute pass. Does not submit the command encoder.
     * Does nothing if the pass is not open.
     */
    endPass(): void;

    /**
     * Submits this pass's command encoder, if it is not the main encoder.
     * The main command encoder is submitted by {@link IGraphicsDevice.frameEnd}.
     * @internal
     * @ai-generated
     */
    submit(): void;
}
