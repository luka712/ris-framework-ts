import type { IDisposable } from "../api/_export.ts";
import type { IGpuCommandEncoder } from "../api/gpu/IGpuCommandEncoder.ts";
import type { WebGpuGraphicsDevice } from "./WebGpuGraphicsDevice.ts";

/**
 * WebGPU command encoder wrapper. {@link start} creates a native encoder; {@link submit} finishes and queues it.
 * @internal
 */
export class WebGpuCommandEncoder implements IGpuCommandEncoder {

    private readonly _gpuDevice: GPUDevice;
    private readonly _commandEncoderDescriptor: GPUCommandEncoderDescriptor = {};
    private readonly _queueDisposable: IDisposable[] = [];

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param label An optional debug label.
     */
    constructor(graphicsDevice: WebGpuGraphicsDevice, label?: string) {
        this._gpuDevice = graphicsDevice.device;
        this._commandEncoderDescriptor.label = label;
        this.label = label;
        this.start();
    }


    /** @inheritdoc */
    public readonly label?: string;

    /** The native command encoder, or null after {@link submit}. */
    public gpuCommandEncoder: GPUCommandEncoder | null = null;

    /** @inheritdoc */
    public start(): void {
        if (this.gpuCommandEncoder) {
            return;
        }
        this.gpuCommandEncoder = this._gpuDevice.createCommandEncoder(this._commandEncoderDescriptor);
    }

    /** @inheritdoc */
    public queueDispose(disposable: IDisposable): void {
        this._queueDisposable.push(disposable);
    }

    /** @inheritdoc */
    public submit(): void {
        if (!this.gpuCommandEncoder) {
            console.warn(`No active encoder found for GpuCommandEncoder ${this.label}.`);
            return;
        }
        this._gpuDevice.queue.submit([this.gpuCommandEncoder.finish()]);
        this.gpuCommandEncoder = null;

        while (this._queueDisposable.length > 0) {
            this._queueDisposable.pop()?.dispose();
        }
    }

    /** @inheritdoc */
    public dispose(): void {
        this.gpuCommandEncoder = null;
        while (this._queueDisposable.length > 0) {
            this._queueDisposable.pop()?.dispose();
        }
    }
}
