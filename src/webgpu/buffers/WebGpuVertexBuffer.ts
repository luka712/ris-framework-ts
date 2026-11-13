import {BufferUsage, type IFramework, type IVertexBuffer} from "../../api/index.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";

/**
 * The WebGPU vertex buffer. Always created with COPY_DST so it can be updated.
 * @internal
 */
export class WebGpuVertexBuffer implements IVertexBuffer {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private  _initialData: Float32Array | null = null;
    private readonly _vertexCount: number;
    private readonly _byteSize: number;
    private _gpuBuffer: GPUBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param dataOrVertexCount The float vertex data, or the number of vertices to allocate.
     * @param _byteStride The vertex stride in bytes.
     * @param _bufferUsage The buffer usage.
     * @param _label The label.
     */
    public constructor(framework: IFramework,
                       dataOrVertexCount: ArrayLike<number> | number,
                       private readonly _byteStride: number,
                       private readonly _bufferUsage: BufferUsage,
                       private readonly _label?: string) {

        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        if (typeof dataOrVertexCount === "number") {
            this._vertexCount = dataOrVertexCount;
            this._byteSize = dataOrVertexCount * this._byteStride;
            this._initialData = new Float32Array(this._byteSize / Float32Array.BYTES_PER_ELEMENT);
        } else {
            this._initialData = new Float32Array(dataOrVertexCount);
            this._byteSize = this._initialData.byteLength;
            this._vertexCount = this._byteSize / this._byteStride;
        }
    }

    /** The WebGPU buffer. */
    public get gpuBuffer(): GPUBuffer {
        if (!this._gpuBuffer) {
            throw new Error("WebGpuVertexBuffer: the buffer is not initialized or is disposed.");
        }
        return this._gpuBuffer;
    }

    /** @inheritDoc */
    public get label(): string | undefined {
        return this._label;
    }

    /** @inheritDoc */
    public get vertexCount(): number {
        return this._vertexCount;
    }

    /** @inheritDoc */
    public get byteSize(): number {
        return this._byteSize;
    }

    /** @inheritDoc */
    public get byteStride(): number {
        return this._byteStride;
    }

    /** @inheritDoc */
    public get usage(): BufferUsage {
        return this._bufferUsage;
    }

    /** @inheritDoc */
    public initialize(): void {
        const device = this._graphicsDevice.device;
        this._gpuBuffer = WebGpuUtilities.buffer.createVertexBufferAsync(device, this._initialData ?? this._byteSize, this._bufferUsage, this._label);
        this._initialData = null;
    }

    /**
     * Updates the buffer.
     * @param data The float data.
     * @param offset The first element to write (in floats).
     * @param length The number of elements to write; 0 or less writes everything after the offset.
     */
    public update(data: Float32Array, offset: number = 0, length: number = 0): void {
        WebGpuUtilities.buffer.writeBuffer(this._graphicsDevice.device.queue, this.gpuBuffer, data, offset, length);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = null;
    }
}
