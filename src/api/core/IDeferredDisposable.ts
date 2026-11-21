import type { IDisposable } from "./IDisposable.ts";

/**
 * A GPU resource that can also be disposed safely at the end of the frame.
 * Use {@link queueDispose} when the resource may still be used by commands recorded in the current frame.
 */
export interface IDeferredDisposable extends IDisposable {

    /**
     * Disposes the resource after the current frame is submitted.
     * The resource stays usable until then.
     */
    queueDispose(): void;
}
