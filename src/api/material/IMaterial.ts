import {mat4} from "gl-matrix";
import type { IDisposable } from "../core/IDisposable.ts";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type { IMesh } from "../meshes/IMesh.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";

/**
 * The material interface.
 */
export interface IMaterial extends IDisposable {

    /**
     * The model matrix.
     */
    modelMatrix: mat4;

    /**
     * The geometry format required by the material.
     */
    readonly geometryFormat: GeometryFormat;

    /**
     * Called before rendering.
     */
    beforeRender(): void;

    /**
     * Renders the material.
     * @param mesh - The mesh.
     */
    renderMesh(mesh: IMesh): void;

    /**
     * Renders the material.
     * @param vertexBuffer - The vertex buffer.
     * @param indexBuffer - The index buffer.
     */
    render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer): void;

}
