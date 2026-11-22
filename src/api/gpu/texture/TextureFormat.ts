/**
 * The texture format.
 */
export enum TextureFormat {
    /**
     * Default value.
     For unknown texture format.
     */
    UNDEFINED = "UNDEFINED",

    /**
     * Red, green, blue, and alpha channels.
     * 8-bit integer per channel.
     * [0, 255] converted to/from float [0, 1] in shader.
     * */
    RGBA8_UNORM = "RGBA8_UNORM",

    /**
     * Red, green, blue, and alpha channels.
     * 8-bit integer per channel.
     * Srgb-color [0, 255] converted to/from linear-color float [0, 1] in shader.
     */
    RGBA8_UNORM_SRGB = "RGBA8_UNORM_SRGB",

    /**
     * Depth 24 and stencil 8.
     */
    DEPTH24_PLUS_STENCIL8 = "DEPTH24_PLUS_STENCIL8",

    /**
     * The depth 32 float.
     */
    DEPTH32_FLOAT = "DEPTH32_FLOAT",

    R32_FLOAT = "R32_FLOAT",
    /**
     * The 32-bit float format with one red component. It is typeless.

     Valid only for D3D11.
     */
    R32_TYPELESS = "R32_TYPELESS",
    /**
     * The BC7 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    BC7_RGBA_UNORM = "BC7_RGBA_UNORM",
    /**
     * The BC3 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    BC3_RGBA_UNORM = "BC3_RGBA_UNORM",
    /**
     * The ETC2 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    ETC2_RGBA8_UNORM = "ETC2_RGBA8_UNORM",

    /** BC7 RGBA, sRGB. Requires EXT_texture_compression_bptc (WebGL) or texture-compression-bc (WebGPU). */
    BC7_RGBA_UNORM_SRGB = "BC7_RGBA_UNORM_SRGB",

    /** BC3 (DXT5) RGBA, sRGB. Requires WEBGL_compressed_texture_s3tc_srgb (WebGL) or texture-compression-bc (WebGPU). */
    BC3_RGBA_UNORM_SRGB = "BC3_RGBA_UNORM_SRGB",

    /** BC1 (DXT1) RGB. Requires WEBGL_compressed_texture_s3tc (WebGL) or texture-compression-bc (WebGPU). */
    BC1_RGB_UNORM = "BC1_RGB_UNORM",

    /** BC1 (DXT1) RGB, sRGB. Requires WEBGL_compressed_texture_s3tc_srgb (WebGL). WebGPU only has BC1 RGBA, which is used instead. */
    BC1_RGB_UNORM_SRGB = "BC1_RGB_UNORM_SRGB",

    /** ETC2 RGBA8 with EAC alpha, sRGB. Requires WEBGL_compressed_texture_etc (WebGL) or texture-compression-etc2 (WebGPU). */
    ETC2_RGBA8_UNORM_SRGB = "ETC2_RGBA8_UNORM_SRGB",

    /** ETC2 RGB8. Requires WEBGL_compressed_texture_etc (WebGL) or texture-compression-etc2 (WebGPU). */
    ETC2_RGB8_UNORM = "ETC2_RGB8_UNORM",

    /** ETC2 RGB8, sRGB. Requires WEBGL_compressed_texture_etc (WebGL) or texture-compression-etc2 (WebGPU). */
    ETC2_RGB8_UNORM_SRGB = "ETC2_RGB8_UNORM_SRGB",


    /** The ASTC 4x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_4X4_UNORM = "ASTC_4X4_UNORM",

    /** The ASTC 4x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_4X4_UNORM_SRGB = "ASTC_4X4_UNORM_SRGB",

    /** The ASTC 5x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_5X4_UNORM = "ASTC_5X4_UNORM",

    /** The ASTC 5x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_5X4_UNORM_SRGB = "ASTC_5X4_UNORM_SRGB",

    /** The ASTC 5x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_5X5_UNORM = "ASTC_5X5_UNORM",

    /** The ASTC 5x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_5X5_UNORM_SRGB = "ASTC_5X5_UNORM_SRGB",

    /** The ASTC 6x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_6X5_UNORM = "ASTC_6X5_UNORM",

    /** The ASTC 6x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_6X5_UNORM_SRGB = "ASTC_6X5_UNORM_SRGB",

    /** The ASTC 6x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_6X6_UNORM = "ASTC_6X6_UNORM",

    /** The ASTC 6x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_6X6_UNORM_SRGB = "ASTC_6X6_UNORM_SRGB",

    /** The ASTC 8x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_8X5_UNORM = "ASTC_8X5_UNORM",

    /** The ASTC 8x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_8X5_UNORM_SRGB = "ASTC_8X5_UNORM_SRGB",

    /** The ASTC 8x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_8X6_UNORM = "ASTC_8X6_UNORM",

    /** The ASTC 8x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_8X6_UNORM_SRGB = "ASTC_8X6_UNORM_SRGB",

    /** The ASTC 8x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_8X8_UNORM = "ASTC_8X8_UNORM",

    /** The ASTC 8x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_8X8_UNORM_SRGB = "ASTC_8X8_UNORM_SRGB",

    /** The ASTC 10x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X5_UNORM = "ASTC_10X5_UNORM",

    /** The ASTC 10x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X5_UNORM_SRGB = "ASTC_10X5_UNORM_SRGB",

    /** The ASTC 10x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X6_UNORM = "ASTC_10X6_UNORM",

    /** The ASTC 10x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X6_UNORM_SRGB = "ASTC_10X6_UNORM_SRGB",

    /** The ASTC 10x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X8_UNORM = "ASTC_10X8_UNORM",

    /** The ASTC 10x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X8_UNORM_SRGB = "ASTC_10X8_UNORM_SRGB",

    /** The ASTC 10x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X10_UNORM = "ASTC_10X10_UNORM",

    /** The ASTC 10x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X10_UNORM_SRGB = "ASTC_10X10_UNORM_SRGB",

    /** The ASTC 12x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_12X10_UNORM = "ASTC_12X10_UNORM",

    /** The ASTC 12x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_12X10_UNORM_SRGB = "ASTC_12X10_UNORM_SRGB",

    /** The ASTC 12x12 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_12X12_UNORM = "ASTC_12X12_UNORM",

    /** The ASTC 12x12 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_12X12_UNORM_SRGB = "ASTC_12X12_UNORM_SRGB",

    /** The PVRTC1 compressed format at 4 bits per pixel with RGBA components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC1_RGBA_4BPP_UNORM = "PVRTC1_RGBA_4BPP_UNORM",

    /** The PVRTC1 compressed format at 4 bits per pixel with RGB components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC1_RGB_4BPP_UNORM = "PVRTC1_RGB_4BPP_UNORM",

    /** The PVRTC1 compressed format at 2 bits per pixel with RGBA components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC1_RGBA_2BPP_UNORM = "PVRTC1_RGBA_2BPP_UNORM",

    /** The PVRTC1 compressed format at 2 bits per pixel with RGB components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC1_RGB_2BPP_UNORM = "PVRTC1_RGB_2BPP_UNORM",
}

/** Every ASTC texture format (linear and sRGB). They require `WEBGL_compressed_texture_astc` on WebGL2 and `texture-compression-astc` on WebGPU. */
export const ASTC_TEXTURE_FORMATS = [
    TextureFormat.ASTC_4X4_UNORM,
    TextureFormat.ASTC_4X4_UNORM_SRGB,
    TextureFormat.ASTC_5X4_UNORM,
    TextureFormat.ASTC_5X4_UNORM_SRGB,
    TextureFormat.ASTC_5X5_UNORM,
    TextureFormat.ASTC_5X5_UNORM_SRGB,
    TextureFormat.ASTC_6X5_UNORM,
    TextureFormat.ASTC_6X5_UNORM_SRGB,
    TextureFormat.ASTC_6X6_UNORM,
    TextureFormat.ASTC_6X6_UNORM_SRGB,
    TextureFormat.ASTC_8X5_UNORM,
    TextureFormat.ASTC_8X5_UNORM_SRGB,
    TextureFormat.ASTC_8X6_UNORM,
    TextureFormat.ASTC_8X6_UNORM_SRGB,
    TextureFormat.ASTC_8X8_UNORM,
    TextureFormat.ASTC_8X8_UNORM_SRGB,
    TextureFormat.ASTC_10X5_UNORM,
    TextureFormat.ASTC_10X5_UNORM_SRGB,
    TextureFormat.ASTC_10X6_UNORM,
    TextureFormat.ASTC_10X6_UNORM_SRGB,
    TextureFormat.ASTC_10X8_UNORM,
    TextureFormat.ASTC_10X8_UNORM_SRGB,
    TextureFormat.ASTC_10X10_UNORM,
    TextureFormat.ASTC_10X10_UNORM_SRGB,
    TextureFormat.ASTC_12X10_UNORM,
    TextureFormat.ASTC_12X10_UNORM_SRGB,
    TextureFormat.ASTC_12X12_UNORM,
    TextureFormat.ASTC_12X12_UNORM_SRGB,
]