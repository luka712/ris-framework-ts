import {mat4} from "gl-matrix";
import {IDisposable} from "../core/IDisposable";
import {GeometryFormat} from "../geometry/GeometryFormat";
import {IMesh} from "../meshes/IMesh";
import {IVertexBuffer} from "../rendering/buffers/IVertexBuffer";
import {IIndexBuffer} from "../rendering/buffers/IIndexBuffer";

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
