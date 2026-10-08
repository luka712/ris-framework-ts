/**
 * The texture format.
 */
export enum TextureFormat {
    /**
     * Default value.
     For unknown texture format.
     */
    UNDEFINED = 0,

    /**
     * Red, green, blue, and alpha channels.
     * 8-bit integer per channel.
     * [0, 255] converted to/from float [0, 1] in shader.
     * */
    RGBA_8_UNORM = 1,

    /**
     * Red, green, blue, and alpha channels.
     * 8-bit integer per channel.
     * Srgb-color [0, 255] converted to/from linear-color float [0, 1] in shader.
     */
    RGBA_8_UNORM_SRGB = 2,

    /**
     * Depth 24 and stencil 8.
     */
    DEPTH_24_STENCIL_8 = 3,

    /**
     * The depth 32 float.
     */
    DEPTH_32_FLOAT = 4,

    RED_32_FLOAT = 5,
    /**
     * The 32-bit float format with one red component. It is typeless.

     Valid only for D3D11.
     */
    RED_32_TYPELESS = 6,
    /**
     * The BC7 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    BC7_RGBA_UNORM = 7,
    /**
     * The BC3 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    BC3_RGBA_UNORM = 8,
    /**
     * The ETC2 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    ETC2_RGBA8_UNORM = 9,
    /**
     * The ASTC 4x4 compressed format with four 8-bit normalized unsigned integer components in RGBA order.
     */
    ASTC_4X4_RGBA = 10
}
