/**
 * Represents the texture compression capabilities of a graphics device.
 */
export interface IGraphicsDeviceFeatures {

    /**
     * Supports S3TC / DXT (BC1–BC3) texture compression.
     */
    readonly supportsTextureCompressionS3TC: boolean;

    /**
     * Supports the sRGB variants of S3TC / DXT (BC1–BC3).
     * In WebGL2 this needs WEBGL_compressed_texture_s3tc_srgb; in WebGPU it is part of texture-compression-bc.
     */
    readonly supportsTextureCompressionS3TCSrgb: boolean;

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
     * Supports PVRTC (PowerVR Texture Compression) 1.
     * PVRTC 2 is not supported by either WebGL2 or WebGPU context.
     */
    readonly supportsTextureCompressionPVRTC: boolean;

}
