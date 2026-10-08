/**
 * The primitive topology.
 */
export enum PrimitiveTopology {
/**
 * Each consecutive pair of two vertices defines a line primitive.
 */
  LINE_LIST = 0,
/**
 * Each vertex after the first defines a line primitive between it and the previous vertex.
 */
  LINE_STRIP = 1,
/**
 * Each vertex defines a point primitive.
 */
  POINT_LIST = 2,
/**
 * Each consecutive triplet of three vertices defines a triangle primitive.
 */
  TRIANGLE_LIST = 3,
/**
 * Each vertex after the first two defines a triangle primitive between it and the previous two vertices.
 */
  TRIANGLE_STRIP = 4
}
