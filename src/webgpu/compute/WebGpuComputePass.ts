import type { IComputePassDescriptor } from "../../api/gpu/compute/pass/IComputePassDescriptor.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import type { WebGpuCommandEncoder } from "../WebGpuCommandEncoder.ts";
import { AComputePass } from "../../api/gpu/compute/pass/AComputePass.ts";

/**
 * The WebGPU compute pass. Uses the descriptor's command encoder, or the device's main encoder.
 * {@link endPass} ends the GPU pass; {@link submit} submits a custom encoder only.
 * @internal
 */
export class WebGpuComputePass extends AComputePass {

    private readonly _commandEncoder: WebGpuCommandEncoder;

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param descriptor The compute pass descriptor.
     */
    public constructor(graphicsDevice: WebGpuGraphicsDevice, descriptor: IComputePassDescriptor) {
        super(graphicsDevice, descriptor);
        this._commandEncoder = (descriptor.commandEncoder ?? graphicsDevice.mainCommandEncoder) as WebGpuCommandEncoder;
    }

    /**
     * The underlying WebGPU compute pass encoder.
     */
    public gpuComputePassEncoder: GPUComputePassEncoder | null = null;


    /** @inheritdoc */
    protected _beginPass(): void {
        if (this.gpuComputePassEncoder) {
            throw new Error("WebGpuComputePass: the pass is already open.");
        }
        const gpuEncoder = this._commandEncoder.gpuCommandEncoder;
        if (!gpuEncoder) {
            throw new Error("WebGpuComputePass.beginPass: the command encoder is not started.");
        }
        this.gpuComputePassEncoder = gpuEncoder.beginComputePass({ label: this._descriptor.label });
    }

    /** @inheritdoc */
    public endPass(): void {
        this.gpuComputePassEncoder?.end();
        this.gpuComputePassEncoder = null;
    }

    /** @inheritDoc */
    public dispose(): void {
        this.endPass();
    }
}
