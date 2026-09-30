
import {VertexFormat} from "../../geometry/VertexFormat";

/**
 * The vertex attribute class.
 * A vertex attribute defines a single attribute of a vertex, such as position, normal, color, etc.
 * It is used to define the layout of the vertex buffer, and how the vertex shader will read the vertex data.
 */
export class VertexAttribute {

    /**
     * The format of the vertex attribute.
     * It defines the type and size of the attribute, such as float3 for position, float2 for UV, etc.
     */
    public format = VertexFormat.FLOAT_32;

    /**
     * The offset, in bytes, of the vertex attribute from the start of the vertex.
     */
    public offset = 0;

    /**
     * The shader location of the vertex attribute.
     */
    public shaderLocation = 0;
}
