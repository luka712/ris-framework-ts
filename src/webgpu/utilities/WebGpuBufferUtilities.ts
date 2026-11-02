import { BufferUsage } from "../../api";
import { WebGpuConverter } from "./WebGpuConverter";

/** The typed arrays that can be written to a buffer. */
type BufferData = Float32Array | Uint16Array | Uint32Array;

/** The utilities for WebGPU buffers. */
export class WebGpuBufferUtilities {

    /**
     * Creates a vertex buffer. VERTEX and COPY_DST are always added, so the buffer can be updated.
     * @param device The device to create the buffer on.
     * @param sizeOrData The size in bytes or data to create the buffer with.
     * @param usage The usage of the buffer.
     * @param label The label of the buffer.
     * @returns The created buffer.
     */
    public createVertexBufferAsync(device: GPUDevice, sizeOrData: number | Float32Array, usage: BufferUsage, label?: string): GPUBuffer {
        return this._createBuffer(device, sizeOrData, usage | BufferUsage.VERTEX | BufferUsage.COPY_DST, label);
    }

    /**
     * Creates an index buffer. INDEX and COPY_DST are always added, so the buffer can be updated.
     * WebGPU requires the size to be a multiple of 4, so the size is padded (odd uint16 counts).
     * @param device The device to create the buffer on.
     * @param sizeOrData The size in bytes or data to create the buffer with.
     * @param usage The usage of the buffer.
     * @param label The label of the buffer.
     * @returns The created buffer.
     */
    public createIndexBufferAsync(device: GPUDevice, sizeOrData: number | Uint16Array | Uint32Array, usage: BufferUsage, label?: string): GPUBuffer {
        return this._createBuffer(device, sizeOrData, usage | BufferUsage.INDEX | BufferUsage.COPY_DST, label);
    }

    /**
     * Creates a uniform buffer. UNIFORM and COPY_DST are always added, so the buffer can be updated.
     * @param device The device to create the buffer on.
     * @param sizeOrData The size in bytes or data to create the buffer with. Should be aligned to 16 bytes.
     * @param usage The usage of the buffer.
     * @param label The label of the buffer.
     * @returns The created buffer.
     */
    public createUniformBufferAsync(device: GPUDevice, sizeOrData: number | Float32Array, usage: BufferUsage, label?: string): GPUBuffer {
        return this._createBuffer(device, sizeOrData, usage | BufferUsage.UNIFORM | BufferUsage.COPY_DST, label);
    }

    /**
     * Writes the data to the buffer. The data mirrors the buffer, so the offset is used for both.
     * @param queue The queue to write the data to.
     * @param buffer The buffer to write the data to.
     * @param data The data to write to the buffer.
     * @param offset The offset in elements (floats or indices), in both the buffer and the data.
     * @param length The number of elements to write. If 0 or less, everything after the offset is written.
     */
    public writeBuffer(queue: GPUQueue, buffer: GPUBuffer, data: BufferData, offset: number = 0, length: number = 0): void {

        const elementSize = data.BYTES_PER_ELEMENT;
        length = length > 0 ? length : data.length - offset;
        length = Math.min(length, data.length - offset);

        const byteOffset = offset * elementSize;
        // WebGPU requires the write size to be a multiple of 4.
        const byteLength = Math.min(length * elementSize, buffer.size - byteOffset) & ~3;
        if (byteLength <= 0) {
            return;
        }

        queue.writeBuffer(buffer, byteOffset, data.buffer as ArrayBuffer, data.byteOffset + byteOffset, byteLength);
    }

    private _createBuffer(device: GPUDevice, sizeOrData: number | BufferData, usage: BufferUsage, label?: string): GPUBuffer {
        const byteSize = typeof sizeOrData === "number" ? sizeOrData : sizeOrData.byteLength;

        const buffer = device.createBuffer({
            label,
            // WebGPU buffer sizes must be a multiple of 4 and not 0.
            size: Math.max(4, (byteSize + 3) & ~3),
            usage: WebGpuConverter.convertBufferUsage(usage),
        });

        if (typeof sizeOrData !== "number" && sizeOrData.byteLength > 0) {
            this._writePadded(device.queue, buffer, sizeOrData);
        }

        return buffer;
    }

    /** Writes the whole data, padding it to 4 bytes when needed. */
    private _writePadded(queue: GPUQueue, buffer: GPUBuffer, data: BufferData): void {
        if ((data.byteLength & 3) === 0) {
            this.writeBuffer(queue, buffer, data);
            return;
        }
        const padded = new Uint8Array((data.byteLength + 3) & ~3);
        padded.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
        queue.writeBuffer(buffer, 0, padded.buffer, 0, padded.byteLength);
    }
}
