import type { IDisposable } from "../core/IDisposable.ts";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type { IRenderableMesh } from "../meshes/IRenderableMesh.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";

/**
 * The material interface.
 * @public
 */
export interface IMaterial extends IDisposable {

    /**
     * The model buffer (std140 `mat4`) for materials that use one (unlit, Blinn-Phong, inspect mips).
     * A mesh owns it and assigns it before drawing, like the scene assigns its camera; materials never dispose it.
     * Materials without the property (e.g. the sprite material) are left alone.
     */
    modelBuffer?: IUniformBuffer;

    /** The geometry format required by the material.*/
    readonly geometryFormat: GeometryFormat;

    /**
     * Called before rendering.
     */
    beforeRender(): void;

    /**
     * Renders the mesh with this material, honouring the mesh's index range.
     * @param mesh - The mesh.
     */
    renderMesh(mesh: IRenderableMesh): void;

    /**
     * Renders the material.
     * @param vertexBuffer - The vertex buffer.
     * @param indexBuffer - The index buffer.
     * @param indicesCount - The number of indices to draw. -1 or undefined draws all.
     * @param indicesOffset - The first index to draw. Defaults to 0.
     */
    render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void;

}
