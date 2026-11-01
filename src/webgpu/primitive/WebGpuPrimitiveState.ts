import {
    type CullMode,
    type FrontFace,
    type IPrimitiveState,
    type IPrimitiveStateDescriptor,
    type PrimitiveTopology,
} from "../../api/index.ts";
import type {GpuCullMode, GpuFrontFace, GpuPrimitiveTopology} from "../WebGpuTypes.ts";
import {resolvePrimitiveStateDescriptor} from "../../core/rendering/primitive/PrimitiveStateDescriptorUtilities.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";

/**
 * The WebGPU primitive state. WebGPU bakes it into the render pipeline, so this only holds the converted values.
 * @internal
 */
export class WebGpuPrimitiveState implements IPrimitiveState {

    /**
     * The constructor.
     * @param descriptor The primitive state descriptor.
     */
    public constructor(descriptor?: IPrimitiveStateDescriptor) {
        const resolved = resolvePrimitiveStateDescriptor(descriptor);
        this.topology = resolved.topology;
        this.cullFace = resolved.cullFace;
        this.frontFace = resolved.frontFace;
        this.gpuTopology = WebGpuConverter.convertTopology(this.topology);
        this.gpuCullMode = WebGpuConverter.convertCullMode(this.cullFace);
        this.gpuFrontFace = WebGpuConverter.convertFrontFace(this.frontFace);
    }

    /** @inheritDoc */
    public readonly topology: PrimitiveTopology;

    /** @inheritDoc */
    public readonly cullFace: CullMode;

    /** @inheritDoc */
    public readonly frontFace: FrontFace;

    /** The WebGPU topology. */
    public readonly gpuTopology: GpuPrimitiveTopology;

    /** The WebGPU cull mode. */
    public readonly gpuCullMode: GpuCullMode;

    /** The WebGPU front face. */
    public readonly gpuFrontFace: GpuFrontFace;

    /** The `GPUPrimitiveState` for a render pipeline. */
    public get gpuPrimitiveState(): { topology: GpuPrimitiveTopology; cullMode: GpuCullMode; frontFace: GpuFrontFace } {
        return {topology: this.gpuTopology, cullMode: this.gpuCullMode, frontFace: this.gpuFrontFace};
    }
}
