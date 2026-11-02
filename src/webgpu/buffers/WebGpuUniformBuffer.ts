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
    private _initialData: Float32Array | null = null;
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
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        this.usage = bufferUsage;
        this.label = label;
        this.id = WebGpuUniformBuffer._nextId++;
        const floatCount = typeof dataOrFloatCount === "number" ? dataOrFloatCount : dataOrFloatCount.length;
        // Uniform buffer bindings must be a multiple of 16 bytes.
        const alignedFloats = Math.max(4, Math.ceil(floatCount / 4) * 4);
        this._initialData = new Float32Array(alignedFloats);
        if (typeof dataOrFloatCount !== "number") {
            this._initialData.set(dataOrFloatCount);
        }
        this._byteSize = this._initialData.byteLength;
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
        this._gpuBuffer = WebGpuUtilities.buffer.createUniformBufferAsync(this._graphicsDevice.device, this._initialData ?? this._byteSize, this.usage, this.label);
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
