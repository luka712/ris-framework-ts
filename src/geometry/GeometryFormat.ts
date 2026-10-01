/**
 * The geometry format.
 */
export enum GeometryFormat {
  /**
   * Geometry format where:
   * First 3 floats are reserved for vertex position.Following 4 floats are reserved for vertex color.
   */
  POS3_COLOR4 = 0,

  /**
   * Geometry format where:
   * First 3 floats are reserved for vertex position.Following 4 floats are reserved for vertex color.Following 2 floats are reserved for vertex texture coordinates.
   */
  POS3_COLOR4_TEXTURECOORDS2 = 1,

  /**
   * Geometry format where:
   * First 3 floats are reserved for vertex position.Following 4 floats are reserved for vertex color.Following 2 floats are reserved for vertex texture coordinates.
   * When aligned, the vertex format is aligned to 4 floats.
   * Meaning:
   * First 4 floats are reserved for vertex position, but only 3 are used.Following 4 floats are reserved for vertex color.Following 4 floats are reserved for vertex texture coordinates, but only 2 are used.
   */
  POS3_COLOR4_TEXTURECOORDS2_ALIGNED = 2,

  /**
   * Geometry format where:
   * First 3 floats are reserved for vertex position.Following 4 floats are reserved for vertex color.Following 2 floats are reserved for vertex texture coordinates.Following 3 floats are reserved for vertex normal.
   */
  POS3_COLOR4_TEXTURECOORDS2_NORMAL3 = 3,

  /**
   * Geometry format where:
   * First 3 floats are reserved for vertex position.Following 2 floats are reserved for texture coordinates.
   */
  POS3_TEXTURECOORDS2 = 4
}
