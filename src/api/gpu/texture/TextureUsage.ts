/**
 * The usage of the texture.
 */
export enum TextureUsage {
/**
 * No usage. Used when usage is not relevant.
 */
  NONE = 1,
/**
 * The texture can be a copy source.
 */
  COPY_SRC = 2,
/**
 * The texture can be a copy destination, for uploading data.
 */
  COPY_DST = 4,
/**
 * The texture can be bound and read in a shader.
 */
  TEXTURE_BINDING = 8,
/**
 * The texture can be used as a storage texture and written in a shader.
 */
  STORAGE_BINDING = 16,
/**
 * The texture can be used as a render attachment.
 */
  RENDER_ATTACHMENT = 32
}
