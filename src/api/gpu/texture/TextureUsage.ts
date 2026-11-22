/**
 * The usage of the texture.
 */
export enum TextureUsage {
  /**
   * No usage.
   */
  NONE = 0,

  /**
   * The texture can be used as the source of a copy operation.
   */
  COPY_SRC = 1 << 0,

  /**
   * The texture can be used as the destination of a copy operation,
   * including uploading data.
   */
  COPY_DST = 1 << 1,

  /**
   * The texture can be bound as a sampled texture in a shader.
   */
  TEXTURE_BINDING = 1 << 2,

  /**
   * The texture can be bound as a storage texture in a shader.
   */
  STORAGE_BINDING = 1 << 3,

  /**
   * The texture can be used as a render pass attachment.
   */
  RENDER_ATTACHMENT = 1 << 4
}
