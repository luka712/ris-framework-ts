import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {BufferUsage, type IFramework, type IVertexBuffer} from "../../api/index.ts";

/**
 * The WebGL implementation of the vertex buffer.
 * This class is responsible for managing a vertex buffer in WebGL,
 * including creating the buffer, uploading data to the buffer,
 * and providing information about the buffer such as its size and stride.
 */
export class WebGlVertexBuffer implements IVertexBuffer {

    private readonly _graphicsDevice: WebGlGraphicsDevice;
    private readonly _gl: WebGL2RenderingContext;
    private _vertexCount = 0;
    private _byteSize = 0;
    private _data: Float32Array;

    /**
     * The constructor.
     * @param _framework The framework.
     * @param dataOrVertexCount The vertex data, or the number of vertices to allocate.
     * @param _byteStride The size of one vertex in bytes.
     * @param _bufferUsage The buffer usage.
     * @param _label The optional label of the buffer.
     */
    constructor(private readonly _framework: IFramework,
                dataOrVertexCount: ArrayLike<number> | number,
                private readonly _byteStride: number,
                private readonly _bufferUsage: BufferUsage,
                private readonly _label?: string) {
        this._graphicsDevice = this._framework.renderer.graphicsDevice as WebGlGraphicsDevice;
        this._gl = this._graphicsDevice.gl;

        if (typeof dataOrVertexCount === "number") {
            this._vertexCount = dataOrVertexCount;
            this._byteSize = dataOrVertexCount * this._byteStride;
            // Allocate the whole buffer, not one float per vertex.
            this._data = new Float32Array(this._byteSize / Float32Array.BYTES_PER_ELEMENT);
        }
        // Is iterable
        else {
            this._data = new Float32Array(dataOrVertexCount);
            this._byteSize = dataOrVertexCount.length * Float32Array.BYTES_PER_ELEMENT;
            this._vertexCount = this._byteSize / this._byteStride;
        }
    }

    /**
     * The WebGL buffer object that represents the vertex buffer in WebGL.
     */
    public buffer: WebGLBuffer | null = null;

    /** @inheritdoc */
    public get label(): string | undefined {
        return this._label;
    }

    /** @inheritdoc */
    public get vertexCount(): number {
        return this._vertexCount;
    }

    /** @inheritdoc */
    public get byteSize(): number {
        return this._byteSize;
    }

    /** @inheritdoc */
    public get byteStride(): number {
        return this._byteStride;
    }

    /** @inheritdoc */
    public get usage(): BufferUsage {
        return this._bufferUsage;
    }

    /** @inheritdoc */
    public initialize(): void {
        this.buffer = WebGlUtilities.buffer.createVertexBuffer(this._gl, this._data, this._bufferUsage);
    }

    /** @inheritdoc */
    public update(data: number[], offset: number = 0, length: number = 0): void {

        length = length > 0 ? length : data.length;

        for (let i = offset; i < length; ++i) {
            this._data[i] = data[i];
        }

        WebGlUtilities.buffer.updateVertexBuffer(this._gl, this.buffer!, this._data, 0, offset, length);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gl.deleteBuffer(this.buffer);
        this.buffer = null;
    }
}