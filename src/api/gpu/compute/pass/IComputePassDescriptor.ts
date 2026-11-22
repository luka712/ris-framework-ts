import type { IGpuCommandEncoder } from "../../IGpuCommandEncoder";

/** The compute pass descriptor. */
export interface IComputePassDescriptor {

    /** Encoder to use for the compute pass. If not set main thread command encoder is used. */
    commandEncoder?: IGpuCommandEncoder;

    /** The label of the compute pass. */
    label?: string;
}
