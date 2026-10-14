import {mat4} from "gl-matrix";
import type { IDisposable } from "../core/IDisposable.ts";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type { IMesh } from "../meshes/IMesh.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";

/**
 * The material interface.
 * @public
 */
export interface IMaterial extends IDisposable {

    /**
     * The model matrix.
     */
    modelMatrix: mat4;

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
    renderMesh(mesh: IMesh): void;

    /**
     * Renders the material.
     * @param vertexBuffer - The vertex buffer.
     * @param indexBuffer - The index buffer.
     * @param indicesCount - The number of indices to draw. -1 or undefined draws all.
     * @param indicesOffset - The first index to draw. Defaults to 0.
     */
    render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void;

}
