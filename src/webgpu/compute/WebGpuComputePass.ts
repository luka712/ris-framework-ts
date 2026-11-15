import type { IComputePass } from "../../api/gpu/compute/pass/IComputePass.ts";
import type { IComputePassDescriptor } from "../../api/gpu/compute/pass/IComputePassDescriptor.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import type { WebGpuCommandEncoder } from "../WebGpuCommandEncoder.ts";

/**
 * The WebGPU compute pass. Uses the descriptor's command encoder, or the device's main encoder.
 * {@link endPass} ends the GPU pass; {@link submit} submits a custom encoder only.
 * @internal
 */
export class WebGpuComputePass implements IComputePass {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _descriptor: IComputePassDescriptor;
    private readonly _commandEncoder: WebGpuCommandEncoder;
    private _gpuComputePass: GPUComputePassEncoder | null = null;

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param descriptor The compute pass descriptor.
     */
    public constructor(graphicsDevice: WebGpuGraphicsDevice, descriptor: IComputePassDescriptor) {
        this._graphicsDevice = graphicsDevice;
        this._descriptor = descriptor;
        this._commandEncoder = (descriptor.commandEncoder ?? graphicsDevice.mainCommandEncoder) as WebGpuCommandEncoder;
    }

    /**
     * Whether the pass is currently open.
     * @ai-generated
     */
    public get isOpen(): boolean {
        return this._gpuComputePass != null;
    }

    /** @inheritDoc */
    public get label(): string | undefined {
        return this._descriptor.label;
    }

    public set label(value: string | undefined) {
        this._descriptor.label = value;
    }

    /** @inheritDoc */
    public beginPass(): void {
        if (this._gpuComputePass) {
            throw new Error("WebGpuComputePass: the pass is already open.");
        }
        this._commandEncoder.start();
        const gpuEncoder = this._commandEncoder.gpuCommandEncoder;
        if (!gpuEncoder) {
            throw new Error("WebGpuComputePass.beginPass: the command encoder is not started.");
        }
        this._gpuComputePass = gpuEncoder.beginComputePass({ label: this._descriptor.label });
        this._graphicsDevice.setComputePassEncoder(this._gpuComputePass);
        this._graphicsDevice.currentComputePass = this;
    }

    /** @inheritDoc */
    public endPass(): void {
        if (!this._gpuComputePass) {
            return;
        }
        this._graphicsDevice.endComputePassEncoder();
        this._graphicsDevice.currentComputePass = null;
        this._gpuComputePass = null;
    }

    /**
     * Submits this pass's command encoder, if it is not the main encoder.
     * @ai-generated
     */
    public submit(): void {
        if (this._commandEncoder === this._graphicsDevice.mainCommandEncoder) {
            return;
        }
        this._commandEncoder.submit();
    }

    /** @inheritDoc */
    public dispose(): void {
        this.endPass();
    }
}
