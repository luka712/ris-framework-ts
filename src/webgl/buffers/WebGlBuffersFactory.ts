import { WebGlVertexBuffer as WebGlVertexBuffer } from "./WebGlVertexBuffer.ts";
import {WebGLIndexBuffer} from "./webgl-index-buffer.ts";
import {
    BufferUsage,
    type IBufferFactory,
    type IFramework,
    type IIndexBuffer,
    type IUniformBuffer,
    type IVertexBuffer
} from "ris-framework-api";
import {WebGlUniformBuffer} from "./WebGlUniformBuffer.ts";

export class WebGlBuffersFactory implements IBufferFactory {

    /**
     * The constructor of the WebGLBuffersFactory class.
     * @param _framework The framework instance to use for creating buffers.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createVertexBuffer(data: ArrayLike<number>, vertexStride: number, usage: BufferUsage, label?: string): IVertexBuffer {
        const vertexBuffer = new WebGlVertexBuffer(this._framework, data, vertexStride, usage, label );
        vertexBuffer.initialize();
        return vertexBuffer;
    }

    /** @inheritDoc */
    public createUniformBuffer(data: ArrayLike<number>, usage: BufferUsage, label?: string): IUniformBuffer {
        const uniformBuffer = new WebGlUniformBuffer(this._framework, data, usage, label);
        uniformBuffer.initialize();
        return uniformBuffer;
    }

    /** @inheritdoc */
    public createIndexBuffer(data: ArrayLike<number>, label?: string): IIndexBuffer {
        const buffer = new WebGLIndexBuffer(this._framework, label);
        buffer.initialize(data);
        return buffer;
    }


    /** @inheritdoc */
    /*
    public createIndexBuffer(data: Uint16Array | Uint32Array, label: string | null): IIndexBuffer {
        const indexBuffer = new WebGlIndexBuffer(this._framework, label);
        indexBuffer.initialize(data);
        return indexBuffer;
    }



    public createVertexBuffer(
        dataOrByteSize: number[] | number,
        byteStride: number,
        vertexCount: number,
        bufferUsage: BufferUsage = BufferUsage.VERTEX | BufferUsage.COPYDST,
        label: string | null = null): IVertexBuffer {

        const vertexBuffer = new WebGlVertexBuffer(this._framework, label);
        vertexBuffer.initialize(dataOrByteSize, byteStride, vertexCount, bufferUsage);
        return vertexBuffer;
    }

    /** @inheritdoc */
    /*
    public createUniformBuffer(dataOrByteLength: ArrayBuffer | ArrayBufferView | number, bufferUsage: BufferUsage = BufferUsage.UNIFORM | BufferUsage.COPY_DST, label: string | null = null): IUniformBuffer {
        const uniformBuffer = new WebGlUniformBuffer(this._graphicsDevice, bufferUsage, label ?? "");
        uniformBuffer.initialize(dataOrByteLength);
        return uniformBuffer;
    }

     */
}