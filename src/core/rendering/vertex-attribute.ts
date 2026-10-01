import {VertexFormat} from "../../VertexFormat.ts";

export  class VertexAttribute  {
   
    /**
     * The format of the vertex attribute.
     */
    format: VertexFormat = VertexFormat.FLOAT_32;

    /**
     * The offset, in bytes, of the vertex attribute from the start of the vertex.
     */
    offset: number = 0;

    /**
     * The shader location of the vertex attribute.
     *  This is used to bind the vertex attribute to the correct location in the shader.
     */
    shaderLocation: number = 0;
}