import {
    BufferUsage,
    type IBufferFactory,
    type IFramework,
    type IIndexBuffer,
    type IUniformBuffer,
    type IVertexBuffer,
} from "../../api/index.ts";
import {WebGpuVertexBuffer} from "./WebGpuVertexBuffer.ts";
import {WebGpuIndexBuffer} from "./WebGpuIndexBuffer.ts";
import {WebGpuUniformBuffer} from "./WebGpuUniformBuffer.ts";

/**
 * The WebGPU buffers factory.
 * @internal
 */
export class WebGpuBuffersFactory implements IBufferFactory {

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createVertexBuffer(data: ArrayLike<number>, vertexStride: number, usage: BufferUsage = BufferUsage.VERTEX | BufferUsage.COPY_DST, label?: string): IVertexBuffer {
        const buffer = new WebGpuVertexBuffer(this._framework, data, vertexStride, usage, label);
        buffer.initialize();
        return buffer;
    }

    /** @inheritDoc */
    public createUniformBuffer(data: ArrayLike<number>, usage: BufferUsage = BufferUsage.UNIFORM | BufferUsage.COPY_DST, label?: string): IUniformBuffer {
        const buffer = new WebGpuUniformBuffer(this._framework, data, usage, label);
        buffer.initialize();
        return buffer;
    }

    /** @inheritDoc */
    public createIndexBuffer(data: ArrayLike<number>, label?: string): IIndexBuffer {
        const buffer = new WebGpuIndexBuffer(this._framework, label);
        buffer.initialize(data);
        return buffer;
    }
}
