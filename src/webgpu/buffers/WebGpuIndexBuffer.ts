import {BufferUsage, type IFramework, type IIndexBuffer, IndexBufferType} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU index buffer. Uses uint16 when every index fits, otherwise uint32.
 * The allocation and to write are padded to 4 bytes, because WebGPU requires it (odd uint16 counts).
 * @internal
 */
export class WebGpuIndexBuffer implements IIndexBuffer {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _label?: string;
    private _initialData: Uint16Array | Uint32Array | null = null;
    private readonly _type: IndexBufferType;
    private readonly _elementByteSize: number;
    private readonly _indicesCount: number;
    private readonly _byteSize: number;
    private _gpuBuffer: GPUBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param data The index data.
     * @param label The label.
     */
    public constructor(framework: IFramework, data: ArrayLike<number>, label?: string) {
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        this._label = label;
        this._initialData = WebGpuIndexBuffer._canUseUint16(data) ? new Uint16Array(data) : new Uint32Array(data);
        this._type = this._initialData instanceof Uint16Array ? IndexBufferType.UINT_16 : IndexBufferType.UINT_32;
        this._elementByteSize = this._initialData.BYTES_PER_ELEMENT;
        this._indicesCount = this._initialData.length;
        this._byteSize = this._initialData.byteLength;
    }

    /** @inheritDoc */
    public readonly usage: BufferUsage = BufferUsage.INDEX | BufferUsage.COPY_DST;

    /** The WebGPU buffer. */
    public get gpuBuffer(): GPUBuffer {
        if (!this._gpuBuffer) {
            throw new Error("WebGpuIndexBuffer: the buffer is not initialized or is disposed.");
        }
        return this._gpuBuffer;
    }

    /** The WebGPU index format. */
    public get gpuIndexFormat(): GPUIndexFormat {
        return this._type === IndexBufferType.UINT_16 ? "uint16" : "uint32";
    }

    /** The buffer size padded to 4 bytes, as used for `setIndexBuffer`. */
    public get paddedByteSize(): number {
        return (this._byteSize + 3) & ~3;
    }

    /** @inheritDoc */
    public get type(): IndexBufferType {
        return this._type;
    }

    /** @inheritDoc */
    public get elementByteSize(): number {
        return this._elementByteSize;
    }

    /** @inheritDoc */
    public get label(): string {
        return this._label ?? "";
    }

    /** @inheritDoc */
    public get indicesCount(): number {
        return this._indicesCount;
    }

    /** @inheritDoc */
    public get byteSize(): number {
        return this._byteSize;
    }

    private static _canUseUint16(values: ArrayLike<number>): boolean {
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v < 0 || v > 0xFFFF) {
                return false;
            }
        }
        return true;
    }

    /** @inheritDoc */
    public initialize(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = WebGpuUtilities.buffer.createIndexBufferAsync(this._graphicsDevice.device, this._initialData ?? this._byteSize, this.usage, this._label);
        this._initialData = null;
    }

    /**
     * Updates the buffer. The data must use the same index type as the buffer.
     * @param data The index data.
     * @param offset The first element to write (in indices).
     * @param length The number of elements to write; 0 or less writes everything after the offset.
     */
    public update(data: Uint16Array | Uint32Array, offset: number = 0, length: number = 0): void {
        if (data.BYTES_PER_ELEMENT !== this._elementByteSize) {
            throw new Error(`WebGpuIndexBuffer.update: the data has ${data.BYTES_PER_ELEMENT}-byte indices, but the index buffer uses ${this._elementByteSize}-byte indices.`);
        }
        WebGpuUtilities.buffer.writeBuffer(this._graphicsDevice.device.queue, this.gpuBuffer, data, offset, length);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = null;
    }
}
