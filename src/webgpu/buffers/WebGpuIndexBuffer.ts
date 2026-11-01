import {BufferUsage, type IFramework, type IIndexBuffer, IndexBufferType} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {GpuBufferUsage, type GpuBuffer, type GpuIndexFormat} from "../WebGpuTypes.ts";

/**
 * The WebGPU index buffer. Uses uint16 when every index fits, otherwise uint32.
 * The allocation and the write are padded to 4 bytes, because WebGPU requires it (odd uint16 counts).
 * @internal
 */
export class WebGpuIndexBuffer implements IIndexBuffer {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _label?: string;
    private _type = IndexBufferType.UINT_16;
    private _elementByteSize = 0;
    private _indicesCount = 0;
    private _byteSize = 0;
    private _gpuBuffer: GpuBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param label The label.
     */
    public constructor(framework: IFramework, label?: string) {
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        this._label = label;
    }

    /** @inheritDoc */
    public readonly usage: BufferUsage = BufferUsage.INDEX;

    /** The WebGPU buffer. */
    public get gpuBuffer(): GpuBuffer {
        if (!this._gpuBuffer) {
            throw new Error("WebGpuIndexBuffer: the buffer is not initialized or is disposed.");
        }
        return this._gpuBuffer;
    }

    /** The WebGPU index format. */
    public get gpuIndexFormat(): GpuIndexFormat {
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
    public initialize(data: ArrayLike<number>): void {
        this._gpuBuffer?.destroy();
        const use16 = WebGpuIndexBuffer._canUseUint16(data);
        this._type = use16 ? IndexBufferType.UINT_16 : IndexBufferType.UINT_32;
        this._elementByteSize = use16 ? 2 : 4;
        this._indicesCount = data.length;
        this._byteSize = this._indicesCount * this._elementByteSize;

        const padded = Math.max(4, this.paddedByteSize);
        // Allocate the padded size so the write below can include the padding.
        const bytes = new ArrayBuffer(padded);
        if (use16) {
            new Uint16Array(bytes, 0, data.length).set(data);
        } else {
            new Uint32Array(bytes, 0, data.length).set(data);
        }

        const device = this._graphicsDevice.device;
        this._gpuBuffer = device.createBuffer({
            label: this._label,
            size: padded,
            usage: GpuBufferUsage.INDEX | GpuBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(this._gpuBuffer, 0, bytes, 0, padded);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuBuffer?.destroy();
        this._gpuBuffer = null;
    }
}
