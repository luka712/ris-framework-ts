/**
 * The vertex format. Used to describe the format of a vertex attribute.
 */
export enum VertexFormat {
  FLOAT_32 = 0,

  FLOAT_32X2 = 1,

  FLOAT_32X3 = 2,

  FLOAT_32X4 = 3,

  /**
   * The format of a 32-bit float with 16 components. Used for matrix attributes.
   */
  FLOAT_32X16 = 4
}
