/**
 * The texture view dimension.
 */
export enum TextureViewDimension {
  DIMENSIONUNDEFINED = 0,
  DIMENSION1D = 1,
/**
 * Texture view dimension for 2D textures, including multisampled 2D textures.
 */
  DIMENSION_2D = 2,
  DIMENSION2DARRAY = 3,
  DIMENSIONCUBE = 4,
  DIMENSIONCUBEARRAY = 5,
  DIMENSION3D = 6,
  DIMENSIONFORCE32 = 2147483647
}
