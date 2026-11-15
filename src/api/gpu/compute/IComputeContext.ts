import type { IDisposable } from "../../core/IDisposable.ts";
import type { IGraphicsDevice } from "../IGraphicsDevice.ts";
import type { IComputePass } from "./pass/IComputePass.ts";
import type { IComputePassDescriptor } from "./pass/IComputePassDescriptor.ts";

/** A compute context: begin and end compute passes, and push debug groups. */
export interface IComputeContext extends IDisposable {

    /** The graphics device. */
    readonly graphicsDevice: IGraphicsDevice;

    /** The main compute pass. */
    readonly mainComputePass: IComputePass;

    /**
     * The queue of compute passes that are to be executed in after main pass.
     * Filled when {@link createComputePass} is called.
     * @internal
     */
    readonly computePassQueue: Array<IComputePass>;

    /** Initialize the compute context. */
    initialize(): void;

    /**
     * Create a compute pass.
     * @public
     */
    createComputePass(descriptor?: IComputePassDescriptor): IComputePass;

    /**
     * Begins the main compute pass.
     * @throws Error when a compute pass is already open, the context is disposed, or the graphics device is not initialized.
     */
    beginComputePass(): void;

    /**
     * Ends the main compute pass. Queued custom compute passes are submitted after it.
     * The main command encoder is submitted by {@link IGraphicsDevice.frameEnd}.
     * @throws Error when no compute pass is open or the context is disposed.
     */
    endComputePass(): void;

    /**
     * Called after the graphics device submits the main command encoder.
     * Resets dispatched compute pipelines and disposes queued resources.
     * @internal
     */
    frameEnd(): void;

    /**
     * Pushes a debug group on the current compute pass.
     * @param label The group label.
     * @throws Error when no compute pass is open or the context is disposed.
     */
    pushDebugGroup(label: string): void;

    /**
     * Pops the current debug group.
     * @throws Error when no compute pass is open, no debug group is open, or the context is disposed.
     */
    popDebugGroup(): void;
}
