import type { vec3 } from "gl-matrix";
import type { IDisposable } from "../../../_export";

/** TODO */
export interface IComputePipeline extends IDisposable {

    /** TODO */
    initialize(): void;

    /** TOOD */
    dispatch(workgroups: vec3): void;

    /** TODO  */
    dispatchWorkgroup(x: number, y: number, z?: number) : void;

    /**
     * Clears per-frame state. Called at the end of the frame.
     */
    frameEnd(): void;
}
