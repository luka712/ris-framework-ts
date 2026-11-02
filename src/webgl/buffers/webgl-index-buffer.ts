import type {IFramework} from "../../api/index.ts";
import {asWebGLGraphicsDevice} from "../cast/cast";
import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {BufferUsage, type IIndexBuffer, IndexBufferType} from "../../api/index.ts";

/**
 * The WebGLIndexBuffer class is an implementation of the IIndexBuffer interface for WebGL.
 * It represents a buffer that holds index data for rendering in a WebGL context. The class provides properties to access the type, size, and count of indices, as well as a method to initialize the buffer with index data. It also implements the IDisposable interface, allowing it to be disposed of to free resources when it is no longer needed.
 */
export class WebGLIndexBuffer implements IIndexBuffer {

    private readonly _gl: WebGL2RenderingContext;
    private readonly _label?: string;

    private _type = IndexBufferType.UINT_16;
    private _elementByteSize = 0;
    private _indicesCount = 0;
    private _byteSize = 0;
    private _initialData: ArrayLike<number> | null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param label An optional label for the index buffer, which can be used for debugging purposes.
     */
    constructor(framework: IFramework, data: ArrayLike<number>, label?: string) {
        this._initialData = data;
        this._gl = asWebGLGraphicsDevice(framework.renderer.graphicsDevice).gl;
        this._label = label;
        this.usage = BufferUsage.INDEX;
    }

    /** @inheritdoc */
    public readonly usage: BufferUsage = BufferUsage.INDEX;

    /**
     * The WebGL buffer object that represents the index buffer in WebGL.
     * This buffer is used to store the index data on the GPU and is bound to the appropriate target when rendering.
     */
    public buffer: WebGLBuffer | null = null;

    /** @inheritdoc */
    public get type(): IndexBufferType {
        return this._type;
    }

    /** @inheritdoc */
    public get elementByteSize(): number {
        return this._elementByteSize;
    }

    /** @inheritdoc */
    public get label(): string {
        return this._label ?? "";
    }

    /** @inheritdoc */
    public get indicesCount(): number {
        return this._indicesCount;
    }

    /** @inheritdoc */
    public get byteSize(): number {
        return this._byteSize;
    }

    private _canUseUint16(values: ArrayLike<number>): boolean {
        let max = 0;

        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v < 0 || v > 0xFFFF) {
                return false;
            }
            if (v > max) {
                max = v;
            }
        }

        return max <= 0xFFFF;
    }

    /** @inheritdoc */
    public initialize(): void {
        const data = this._initialData ?? [];
        this._initialData = null;

        const typedData = this._canUseUint16(data) ? new Uint16Array(data) : new Uint32Array(data);

        if (typedData instanceof Uint16Array) {
            this._type = IndexBufferType.UINT_16;
            this._elementByteSize = Uint16Array.BYTES_PER_ELEMENT;
        } else if (typedData instanceof Uint32Array) {
            this._type = IndexBufferType.UINT_32;
            this._elementByteSize = Uint32Array.BYTES_PER_ELEMENT;
        } else {
            throw new Error("Invalid data type for index buffer. Expected Uint16Array or Uint32Array.");
        }

        this._indicesCount = data.length;
        this._byteSize = this._indicesCount * this._elementByteSize;
        this.buffer = WebGlUtilities.buffer.createIndexBuffer(this._gl, typedData, BufferUsage.INDEX, this._label);
    }


    /** @inheritdoc */
    public update(data: Uint16Array | Uint32Array, offset: number = 0, length: number = 0): void {
        length = length > 0 ? length : data.length - offset;
        length = Math.min(length, data.length - offset);
        if (length <= 0) {
            return;
        }
        this._gl.bindBuffer(this._gl.COPY_WRITE_BUFFER, this.buffer);
        this._gl.bufferSubData(this._gl.COPY_WRITE_BUFFER, offset * data.BYTES_PER_ELEMENT, data, offset, length);
        this._gl.bindBuffer(this._gl.COPY_WRITE_BUFFER, null);
    }

     /** @inheritdoc */
    public dispose(): void {
      
        if (this.buffer) {
            this._gl.deleteBuffer(this.buffer);
            this.buffer = null;
        }
    }
}