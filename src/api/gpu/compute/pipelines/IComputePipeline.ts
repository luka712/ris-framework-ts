import type { vec3 } from "gl-matrix";
import type { IDisposable } from "../../../_export";

/**
 * A compute pipeline: a compute shader with its resources, dispatched into the current compute pass.
 * The compute counterpart of a render pipeline.
 */
export interface IComputePipeline extends IDisposable {

    /**
     * Creates the GPU resources of the pipeline. Call once before dispatching.
     */
    initialize(): void;

    /**
     * Asynchronous version of {@link initialize}.
     * @returns A promise that resolves when the pipeline is ready to dispatch.
     */
    initializeAsync() : Promise<void>;

    /**
     * Dispatches the compute shader. The counterpart of a render pipeline's `render`.
     * @param workgroups - The number of workgroups in x, y and z.
     */
    dispatch(workgroups: vec3): void;

    /**
     * Dispatches the compute shader with the workgroup counts given separately.
     * @param x - The number of workgroups in x.
     * @param y - The number of workgroups in y.
     * @param z - The number of workgroups in z. By default, 1.
     */
    dispatchWorkgroup(x: number, y: number, z?: number) : void;

    /**
     * Clears per-frame state. Called at the end of the frame.
     */
    frameEnd(): void;
}
