import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IDisposable } from "../core/IDisposable.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IGeometry } from "../geometry/IGeometry.ts";
import type { GeometryFormat } from "../geometry/GeometryFormat.ts";
import type { State } from "../data/State.ts";

/**
 * A mesh: geometry and the vertex and index buffers created from it.
 * It has no material and no transform; see {@link IRenderableMesh} for a mesh that can be drawn.
 * @public
 */
export interface IMesh extends IDisposable {

    /** The state of the mesh. */
    readonly state: State;

    /** The positions, when set through `setMesh`. */
    readonly positions?: number[];

    /** The colors, when set through `setMesh`. */
    readonly colors?: number[];

    /** The texture coordinates, when set through `setMesh`. */
    readonly textureCoords?: number[];

    /** The normals, when set through `setMesh`. */
    readonly normals?: number[];

    /** The indices, when set through `setMesh`. */
    readonly indices?: number[];

    /** The geometry the buffers were created from with `setGeometry`, if any. */
    readonly geometry?: IGeometry;

    /** The vertex buffer, if created. */
    readonly vertexBuffer?: IVertexBuffer;

    /** The index buffer, if created. */
    readonly indexBuffer?: IIndexBuffer;

    /** Creates the buffers from the current data. */
    initialize(): void;

    /**
     * Creates the vertex and index buffers from a geometry.
     * @param geometry The geometry.
     * @param geometryFormat The vertex layout.
     */
    setGeometry(geometry: IGeometry, geometryFormat?: GeometryFormat): void;

    /** Re-creates (or updates) the buffers from the current data. */
    applyChanges(): void;
}
