import {type BufferUsage, type IFramework, type IUniformBuffer} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU uniform buffer. The size is aligned to 16 bytes and the buffer always has UNIFORM | COPY_DST.
 * @internal
 */
export class WebGpuUniformBuffer implements IUniformBuffer {

    private static _nextId = 1;

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _data: Float32Array;
    private readonly _byteSize: number;
    private _gpuBuffer: GPUBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param dataOrFloatCount The initial float data, or the number of floats.
     * @param bufferUsage The buffer usage.
     * @param label The label.
     */
    public constructor(framework: IFramework, dataOrFloatCount: ArrayLike<number> | number, bufferUsage: BufferUsage, label?: string) {
        this._graphicsDevice = framework.graphicsDevice as WebGpuGraphicsDevice;
        this.usage = bufferUsage;
        this.label = label;
        this.id = WebGpuUniformBuffer._nextId++;
        const floatCount = typeof dataOrFloatCount === "number" ? dataOrFloatCount : dataOrFloatCount.length;
        // Uniform buffer bindings must be a multiple of 16 bytes.
        const alignedFloats = Math.max(4, Math.ceil(floatCount / 4) * 4);
        this._data = new Float32Array(alignedFloats);
        if (typeof dataOrFloatCount !== "number") {
            this._data.set(dataOrFloatCount);
        }
        this._byteSize = this._data.byteLength;
    }

    /** A unique id, used to cache bind groups. */
    public readonly id: number;

    /** @inheritDoc */
    public readonly label?: string;

    /** @inheritDoc */
    public readonly usage: BufferUsage;

    /** @inheritDoc */
    public get byteSize(): number {
        return this._byteSize;
    }

    /** The WebGPU buffer. */
    public get gpuBuffer(): GPUBuffer {
        if (!this._gpuBuffer) {
            throw new Error("WebGpuUniformBuffer: the buffer is not initialized or is disposed.");
        }
        return this._gpuBuffer;
    }

    /** @inheritDoc */
    public initialize(): void {
        this._gpuBuffer = WebGpuUtilities.buffer.createUniformBufferAsync(this._graphicsDevice.device, this._data, this.usage, this.label);
    }

    /** @inheritDoc */
    public write(data: Float32Array, offset: number = 0, length: number = 0): void {
        const count = length > 0 ? length : data.length - offset;
        this._data.set(data.subarray(offset, offset + count), offset);
    }

    /**
     * Writes a single float into the CPU-side data.
     * @param value The value.
     * @param offset The offset in floats.
     * @ai-generated
     */
    public writeSingle(value: number, offset: number): void {
        this._data[offset] = value;
    }

    /**
     * Uploads the CPU-side data to the GPU buffer.
     * @ai-generated
     */
    public update(): void {
        WebGpuUtilities.buffer.writeBuffer(this._graphicsDevice.device.queue, this.gpuBuffer, this._data);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = null;
    }
}
