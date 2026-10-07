import {IBlendState} from "../blending/IBlendState";
import {IDisposable} from "../../core/IDisposable";
import {IPrimitiveState} from "../primitive/IPrimitiveState";
import {IVertexBufferLayout} from "../buffers/IVertexBufferLayout";
import {IIndexBuffer} from "../buffers/IIndexBuffer";
import {IVertexBuffer} from "../buffers/IVertexBuffer";

/**
 * The render pipeline interface.
 * Render pipelines are responsible for defining the rendering process, including the shaders,
 * the vertex buffer layout, the render targets, and the draw calls.
 */
export interface IRenderPipeline extends IDisposable {

    /**
     * The blend state of the render pipeline.
     */
    readonly blendState: IBlendState;

    /**
     * The primitive state of the render pipeline.
     */
    readonly primitiveState: IPrimitiveState;

    /**
     * The vertex buffer layout of the render pipeline.
     */
    readonly vertexBufferLayouts: IVertexBufferLayout[];

    /**
     * Initializes the render pipeline.
     *     This method is called by the renderer when the pipeline is added to the renderer.
     */
    initialize(): void;

    /**
     * Draw the pipeline.
     * @param vertexBuffer - The vertex buffer.
     * @param indexBuffer - The index buffer.
     * @param indicesCount - The number of indices to draw. If -1 draws all indices.
     * @param indicesOffset - Indices offset. By default, 0 for no offset.
     */
    render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer,
           indicesCount?: number, indicesOffset?: number): void;


}
