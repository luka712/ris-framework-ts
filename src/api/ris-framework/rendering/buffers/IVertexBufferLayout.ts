import {VertexStepMode} from "./VertexStepMode";
import {VertexAttribute} from "./VertexAttribute";

/**
 * The vertex buffer layout.
 */
export interface IVertexBufferLayout {

/**
 * The stride, in bytes, between elements of the vertex buffer.
 *     This is also known as the "vertex size". It is the size of one vertex in the vertex buffer.
 */
  arrayStride: number;

/**
 * The step mode of the vertex buffer.
 *     It defines how the vertex buffer is stepped through when rendering.
 */
  stepMode: VertexStepMode;

/**
 * The attributes of the vertex buffer.
 *     It defines the layout of the vertex buffer, and how the vertex shader will read the vertex data.
 */
  attributes: VertexAttribute[];

}
