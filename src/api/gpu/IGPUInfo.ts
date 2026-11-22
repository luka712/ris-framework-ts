import {GpuBackend} from "./GpuBackend.ts";

/**
 * The GPU information. Contains the information about the GPU, such as the name, vendor, etc.
 */
export interface IGPUInfo {

    /**
     * The name of the GPU.
     */
    readonly name: string;

    /**
     * The vendor of the GPU.
     */
    readonly vendor: string;

    /**
     * The version of the GPU API.
     */
    readonly apiVersion: string;

    /**
     * The rendering backend used by the GPU. For example, DirectX 12, Vulkan, OpenGL, etc.
     */
    readonly api: GpuBackend;
}
