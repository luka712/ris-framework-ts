/**
 * Represents the texture compression capabilities of a graphics device.
 */
export interface IGraphicsDeviceFeatures {

/**
 * Supports S3TC / DXT (BC1–BC3) texture compression.
 */
  readonly supportsTextureCompressionS3TC: boolean;

/**
 * Supports full Block Compression (BC1–BC7) textures.
    Includes S3TC (BC1–BC3) plus BC4–BC7.
 */
  readonly supportsTextureCompressionBC: boolean;

/**
 * Supports ETC2 / EAC texture compression (OpenGL/ES and Vulkan standard).
 */
  readonly supportsTextureCompressionETC2: boolean;

/**
 * Supports ASTC (Adaptive Scalable Texture Compression) — LDR and HDR profiles.
 */
  readonly supportsTextureCompressionASTC: boolean;

/**
 * Supports PVRTC (PowerVR Texture Compression) 1 and 2.
 */
  readonly supportsTextureCompressionPVRTC: boolean;

}
