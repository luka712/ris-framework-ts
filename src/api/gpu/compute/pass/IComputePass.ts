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
}
