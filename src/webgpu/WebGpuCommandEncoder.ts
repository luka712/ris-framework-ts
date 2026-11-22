import type { IDisposable } from "../api/_export.ts";
import type { IGpuCommandEncoder, ITextureCopyRegion } from "../api/gpu/IGpuCommandEncoder.ts";
import type { WebGpuTexture2D } from "./texture/WebGpuTexture2D.ts";
import type { WebGpuTexture2DArray } from "./texture/WebGpuTexture2DArray.ts";
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

    /**
     * @inheritdoc
     * @ai-generated
     */
    public copyTextureToTexture(source: ITextureCopyRegion, destination: ITextureCopyRegion, arrayLayerCount = 1): void {

        const sourceMipLevel = source.mipLevel ?? 0;
        const destinationMipLevel = destination.mipLevel ?? 0;

        if (sourceMipLevel < 0 || destinationMipLevel < 0) {
            throw new Error("WebGpuCommandEncoder.copyTextureToTexture: mip level must be greater than or equal to 0.");
        }

        const width = Math.max(1, source.texture.size[0] >> sourceMipLevel);
        const height = Math.max(1, source.texture.size[1] >> sourceMipLevel);

        if (width != Math.max(1, destination.texture.size[0] >> destinationMipLevel) ||
            height != Math.max(1, destination.texture.size[1] >> destinationMipLevel)) {
            throw new Error("WebGpuCommandEncoder.copyTextureToTexture: source and destination mip levels must have identical dimensions.");
        }

        this.gpuCommandEncoder!.copyTextureToTexture(
            {
                texture: (source.texture as WebGpuTexture2D | WebGpuTexture2DArray).gpuTexture,
                mipLevel: sourceMipLevel,
                origin: { x: 0, y: 0, z: source.arrayLayer ?? 0 }
            },
            {
                texture: (destination.texture as WebGpuTexture2D | WebGpuTexture2DArray).gpuTexture,
                mipLevel: destinationMipLevel,
                origin: { x: 0, y: 0, z: destination.arrayLayer ?? 0 }
            },
            { width, height, depthOrArrayLayers: arrayLayerCount });
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
