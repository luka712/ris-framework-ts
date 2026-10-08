/**
 * The usage of the texture.
 */
export enum TextureUsage {
/**
 * Can be used in case where it's not relevant, such as in OpenGL.
 */
  NONE = 1,
/**
 * Texture can be read from but has no other usages.
 *     
 *     Corresponds to WGPU_COPY_SRC in WebGPU.
 *     
 *     In D3D11 can be translated to following properties:
 *     D3D11_BIND_SHADER_RESOURCED3D11_USAGE_STAGINGD3D11_BIND_FLAG_NONE
 */
  COPY_SRC = 2,
/**
 * The texture is used as a destination for copying.
 *     To upload data.
 */
  COPY_DST = 4,
/**
 * The texture is used as a source for texture binding.
 *     Can be read in shader.
 *     
 *     The corresponding binding in D3D11 is D3D11_BIND_SHADER_RESOURCE.
 */
  TEXTURE_BINDING = 8,
/**
 * The texture is used as a storage texture.
 *     Can be written in shader.
 */
  STORAGE_BINDING = 16,
/**
 * The texture is used as a render attachment.
 *     
 *     The corresponding binding in D3D11 is D3D11_BIND_RENDER_TARGET.
 */
  RENDER_ATTACHMENT = 32
}
