import {type BufferUsage, type IFramework, type IUniformBuffer} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {GpuBufferUsage, type GpuBuffer} from "../WebGpuTypes.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";

/**
 * The WebGPU uniform buffer. The size is aligned to 16 bytes and the buffer always has UNIFORM | COPY_DST.
 * @internal
 */
export class WebGpuUniformBuffer implements IUniformBuffer {

    private static _nextId = 1;

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _data: Float32Array;
    private readonly _byteSize: number;
    private _gpuBuffer: GpuBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param dataOrFloatCount The initial float data, or the number of floats.
     * @param bufferUsage The buffer usage.
     * @param label The label.
     */
    public constructor(framework: IFramework, dataOrFloatCount: ArrayLike<number> | number, bufferUsage: BufferUsage, label?: string) {
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
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
    public get gpuBuffer(): GpuBuffer {
        if (!this._gpuBuffer) {
            throw new Error("WebGpuUniformBuffer: the buffer is not initialized or is disposed.");
        }
        return this._gpuBuffer;
    }

    /** @inheritDoc */
    public initialize(): void {
        const device = this._graphicsDevice.device;
        this._gpuBuffer = device.createBuffer({
            label: this.label,
            size: this._byteSize,
            usage: WebGpuConverter.convertBufferUsage(this.usage) | GpuBufferUsage.UNIFORM | GpuBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this._gpuBuffer, 0, this._data.buffer, this._data.byteOffset, this._data.byteLength);
    }

    /**
     * Updates the buffer. Only the data's length is written.
     * @param data The float data.
     * @param offset The first float to write.
     * @param length The number of floats to write; defaults to the data's length after the offset.
     */
    public update(data: ArrayLike<number>, offset: number = 0, length?: number): void {
        let count = length ?? data.length - offset;
        count = Math.min(count, this._data.length - offset, data.length - offset);
        if (count <= 0) {
            return;
        }
        for (let i = 0; i < count; i++) {
            this._data[offset + i] = data[offset + i];
        }
        this._graphicsDevice.device.queue.writeBuffer(
            this.gpuBuffer,
            offset * Float32Array.BYTES_PER_ELEMENT,
            this._data.buffer,
            this._data.byteOffset + offset * Float32Array.BYTES_PER_ELEMENT,
            count * Float32Array.BYTES_PER_ELEMENT);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = null;
    }
}
