import {BufferUsage, type IFramework, type IVertexBuffer} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {GpuBufferUsage, type GpuBuffer} from "../WebGpuTypes.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";

/**
 * The WebGPU vertex buffer. Always created with COPY_DST so it can be updated.
 * @internal
 */
export class WebGpuVertexBuffer implements IVertexBuffer {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _data: Float32Array;
    private readonly _vertexCount: number;
    private readonly _byteSize: number;
    private _gpuBuffer: GpuBuffer | null = null;

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
            this._data = new Float32Array(this._byteSize / Float32Array.BYTES_PER_ELEMENT);
        } else {
            this._data = new Float32Array(dataOrVertexCount);
            this._byteSize = this._data.byteLength;
            this._vertexCount = this._byteSize / this._byteStride;
        }
    }

    /** The WebGPU buffer. */
    public get gpuBuffer(): GpuBuffer {
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
        // WebGPU buffer sizes must be a multiple of 4; float data always is.
        this._gpuBuffer = device.createBuffer({
            label: this._label,
            size: Math.max(4, this._byteSize),
            usage: WebGpuConverter.convertBufferUsage(this._bufferUsage) | GpuBufferUsage.VERTEX | GpuBufferUsage.COPY_DST,
        });
        if (this._data.length > 0) {
            device.queue.writeBuffer(this._gpuBuffer, 0, this._data.buffer, this._data.byteOffset, this._data.byteLength);
        }
    }

    /**
     * Updates the buffer.
     * @param data The float data.
     * @param offset The first float to write (in floats, like WebGL).
     * @param length The number of floats to write; 0 writes the whole data.
     */
    public update(data: number[], offset: number = 0, length: number = 0): void {
        length = length > 0 ? length : data.length - offset;
        length = Math.min(length, this._data.length - offset, data.length - offset);
        if (length <= 0) {
            return;
        }
        for (let i = 0; i < length; ++i) {
            this._data[offset + i] = data[offset + i];
        }
        // Write only the changed range, not the whole buffer.
        this._graphicsDevice.device.queue.writeBuffer(
            this.gpuBuffer,
            offset * Float32Array.BYTES_PER_ELEMENT,
            this._data.buffer,
            this._data.byteOffset + offset * Float32Array.BYTES_PER_ELEMENT,
            length * Float32Array.BYTES_PER_ELEMENT);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = null;
    }
}
