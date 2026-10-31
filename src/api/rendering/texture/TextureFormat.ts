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
    RGBA_8_UNORM = "RGBA_8_UNORM",

    /**
     * Red, green, blue, and alpha channels.
     * 8-bit integer per channel.
     * Srgb-color [0, 255] converted to/from linear-color float [0, 1] in shader.
     */
    RGBA_8_UNORM_SRGB = "RGBA_8_UNORM_SRGB",

    /**
     * Depth 24 and stencil 8.
     */
    DEPTH_24_STENCIL_8 = "DEPTH_24_STENCIL_8",

    /**
     * The depth 32 float.
     */
    DEPTH_32_FLOAT = "DEPTH_32_FLOAT_8",

    RED_32_FLOAT = "RED_32_FLOAT_8",
    /**
     * The 32-bit float format with one red component. It is typeless.

     Valid only for D3D11.
     */
    RED_32_TYPELESS = "RED_32_TYPELE_8",
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
    BC7_RGBA_SRGB = "BC7_RGBA_SRGB",

    /** BC3 (DXT5) RGBA, sRGB. Requires WEBGL_compressed_texture_s3tc_srgb (WebGL) or texture-compression-bc (WebGPU). */
    BC3_RGBA_SRGB = "BC3_RGBA_SRGB",

    /** BC1 (DXT1) RGB. Requires WEBGL_compressed_texture_s3tc (WebGL) or texture-compression-bc (WebGPU). */
    BC1_RGB_UNORM = "BC1_RGB_UNORM",

    /** BC1 (DXT1) RGB, sRGB. Requires WEBGL_compressed_texture_s3tc_srgb (WebGL). WebGPU only has BC1 RGBA, which is used instead. */
    BC1_RGB_SRGB = "BC1_RGB_SRGB",

    /** ETC2 RGBA8 with EAC alpha, sRGB. Requires WEBGL_compressed_texture_etc (WebGL) or texture-compression-etc2 (WebGPU). */
    ETC2_RGBA8_SRGB = "ETC2_RGBA8_SRGB",

    /** ETC2 RGB8. Requires WEBGL_compressed_texture_etc (WebGL) or texture-compression-etc2 (WebGPU). */
    ETC2_RGB8_UNORM = "ETC2_RGB8_UNORM",

    /** ETC2 RGB8, sRGB. Requires WEBGL_compressed_texture_etc (WebGL) or texture-compression-etc2 (WebGPU). */
    ETC2_RGB8_SRGB = "ETC2_RGB8_SRGB",


    /** The ASTC 4x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_4X4_RGBA_UNORM = "ASTC_4X4_RGBA_UNORM",

    /** The ASTC 4x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_4X4_RGBA_SRGB = "ASTC_4X4_RGBA_SRGB",

    /** The ASTC 5x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_5X4_RGBA_UNORM = "ASTC_5X4_RGBA_UNORM",

    /** The ASTC 5x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_5X4_RGBA_SRGB = "ASTC_5X4_RGBA_SRGB",

    /** The ASTC 5x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_5X5_RGBA_UNORM = "ASTC_5X5_RGBA_UNORM",

    /** The ASTC 5x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_5X5_RGBA_SRGB = "ASTC_5X5_RGBA_SRGB",

    /** The ASTC 6x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_6X5_RGBA_UNORM = "ASTC_6X5_RGBA_UNORM",

    /** The ASTC 6x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_6X5_RGBA_SRGB = "ASTC_6X5_RGBA_SRGB",

    /** The ASTC 6x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_6X6_RGBA_UNORM = "ASTC_6X6_RGBA_UNORM",

    /** The ASTC 6x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_6X6_RGBA_SRGB = "ASTC_6X6_RGBA_SRGB",

    /** The ASTC 8x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_8X5_RGBA_UNORM = "ASTC_8X5_RGBA_UNORM",

    /** The ASTC 8x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_8X5_RGBA_SRGB = "ASTC_8X5_RGBA_SRGB",

    /** The ASTC 8x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_8X6_RGBA_UNORM = "ASTC_8X6_RGBA_UNORM",

    /** The ASTC 8x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_8X6_RGBA_SRGB = "ASTC_8X6_RGBA_SRGB",

    /** The ASTC 8x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_8X8_RGBA_UNORM = "ASTC_8X8_RGBA_UNORM",

    /** The ASTC 8x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_8X8_RGBA_SRGB = "ASTC_8X8_RGBA_SRGB",

    /** The ASTC 10x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X5_RGBA_UNORM = "ASTC_10X5_RGBA_UNORM",

    /** The ASTC 10x5 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X5_RGBA_SRGB = "ASTC_10X5_RGBA_SRGB",

    /** The ASTC 10x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X6_RGBA_UNORM = "ASTC_10X6_RGBA_UNORM",

    /** The ASTC 10x6 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X6_RGBA_SRGB = "ASTC_10X6_RGBA_SRGB",

    /** The ASTC 10x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X8_RGBA_UNORM = "ASTC_10X8_RGBA_UNORM",

    /** The ASTC 10x8 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X8_RGBA_SRGB = "ASTC_10X8_RGBA_SRGB",

    /** The ASTC 10x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_10X10_RGBA_UNORM = "ASTC_10X10_RGBA_UNORM",

    /** The ASTC 10x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_10X10_RGBA_SRGB = "ASTC_10X10_RGBA_SRGB",

    /** The ASTC 12x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_12X10_RGBA_UNORM = "ASTC_12X10_RGBA_UNORM",

    /** The ASTC 12x10 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_12X10_RGBA_SRGB = "ASTC_12X10_RGBA_SRGB",

    /** The ASTC 12x12 compressed format with four 8-bit normalized unsigned integer components in RGBA order. */
    ASTC_12X12_RGBA_UNORM = "ASTC_12X12_RGBA_UNORM",

    /** The ASTC 12x12 compressed format with four 8-bit normalized unsigned integer components in RGBA order, sRGB-encoded color. */
    ASTC_12X12_RGBA_SRGB = "ASTC_12X12_RGBA_SRGB",

    /** The PVRTC1 compressed format at 4 bits per pixel with RGBA components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC_4BPPV1_RGBA = "PVRTC_4BPPV1_RGBA",

    /** The PVRTC1 compressed format at 4 bits per pixel with RGB components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC_4BPPV1_RGB = "PVRTC_4BPPV1_RGB",

    /** The PVRTC1 compressed format at 2 bits per pixel with RGBA components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC_2BPPV1_RGBA = "PVRTC_2BPPV1_RGBA",

    /** The PVRTC1 compressed format at 2 bits per pixel with RGB components. Requires WEBGL_compressed_texture_pvrtc. */
    PVRTC_2BPPV1_RGB = "PVRTC_2BPPV1_RGB",
}
