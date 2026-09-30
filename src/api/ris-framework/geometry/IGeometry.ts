import {VertexFormat} from "./VertexFormat";
import {GeometryFormat} from "./GeometryFormat";

/**
 * The geometry.
 */
export interface IGeometry {

    /**
     * The vertex count of the geometry.
     */
    readonly vertexCount: number;

    /**
     * The positions of geometry.
     */
    readonly positions?: number[];

    /**
     * The position vertex format of the geometry.
     */
    readonly positionsFormat: VertexFormat;

    /**
     * The color vertices of the geometry.
     */
    colors?: number[];

    /**
     * The color format of geometry.
     */
    readonly colorFormat: VertexFormat;

    /**
     * The texture coordinates of geometry.
     */
    readonly textureCoords?: number[];

    /**
     * The texture coordinates the vertex format of geometry.
     */
    readonly textureFormat: VertexFormat;

    /**
     * The normals of a vertex.
     */
    readonly normals?: number[];

    /**
     * The vertex format of normal property.
     */
    readonly normalsFormat: VertexFormat;

    /**
     * The indices of geometry.
     */
    readonly indices?: number[];

    /**
     * Converts data of this geometry to interleaved buffer format.
     * @param format - The format of the geometry.
     * @returns The interleaved data of the geometry.
     */
    toInterleaved(format: GeometryFormat): number[];

}
