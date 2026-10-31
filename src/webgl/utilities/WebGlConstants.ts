/**
 * WebGL extension constants that WebGL2RenderingContext does not expose.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants
 */
export class WebGlConstants {

    /** BC1 RGB */
    public static readonly GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;

    /** BC1 RGB sRGB (WEBGL_compressed_texture_s3tc_srgb) */
    public static readonly GL_COMPRESSED_SRGB_S3TC_DXT1_EXT = 0x8C4C;

    /** BC3 sRGB (WEBGL_compressed_texture_s3tc_srgb) */
    public static readonly GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 0x8C4F;

    /** BC7 sRGB (EXT_texture_compression_bptc) */
    public static readonly GL_COMPRESSED_SRGB_ALPHA_BPTC_UNORM = 0x8E8D;

    /** ETC2 RGB8 */
    public static readonly GL_COMPRESSED_RGB8_ETC2 = 0x9274;

    /** ETC2 RGB8 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ETC2 = 0x9275;

    /** ETC2 RGBA8 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 0x9279;

    /** BC3 */
    public static readonly GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

    /** BC7 */
    public static readonly GL_COMPRESSED_RGBA_BPTC_UNORM = 0x8E8C;

    /** ETC2 */
    public static readonly GL_COMPRESSED_RGBA8_ETC2_EAC = 0x9278;

    // ASTC (WEBGL_compressed_texture_astc).

    /** ASTC 4x4 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;

    /** ASTC 4x4 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 0x93D0;

    /** ASTC 5x4 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_5x4_KHR = 0x93B1;

    /** ASTC 5x4 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR = 0x93D1;

    /** ASTC 5x5 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_5x5_KHR = 0x93B2;

    /** ASTC 5x5 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR = 0x93D2;

    /** ASTC 6x5 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_6x5_KHR = 0x93B3;

    /** ASTC 6x5 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR = 0x93D3;

    /** ASTC 6x6 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_6x6_KHR = 0x93B4;

    /** ASTC 6x6 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR = 0x93D4;

    /** ASTC 8x5 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_8x5_KHR = 0x93B5;

    /** ASTC 8x5 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR = 0x93D5;

    /** ASTC 8x6 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_8x6_KHR = 0x93B6;

    /** ASTC 8x6 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR = 0x93D6;

    /** ASTC 8x8 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_8x8_KHR = 0x93B7;

    /** ASTC 8x8 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR = 0x93D7;

    /** ASTC 10x5 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_10x5_KHR = 0x93B8;

    /** ASTC 10x5 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR = 0x93D8;

    /** ASTC 10x6 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_10x6_KHR = 0x93B9;

    /** ASTC 10x6 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR = 0x93D9;

    /** ASTC 10x8 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_10x8_KHR = 0x93BA;

    /** ASTC 10x8 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR = 0x93DA;

    /** ASTC 10x10 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_10x10_KHR = 0x93BB;

    /** ASTC 10x10 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR = 0x93DB;

    /** ASTC 12x10 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_12x10_KHR = 0x93BC;

    /** ASTC 12x10 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR = 0x93DC;

    /** ASTC 12x12 */
    public static readonly GL_COMPRESSED_RGBA_ASTC_12x12_KHR = 0x93BD;

    /** ASTC 12x12 sRGB */
    public static readonly GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR = 0x93DD;

    // PVRTC (WEBGL_compressed_texture_pvrtc).

    /** PVRTC 4 bits per pixel, RGB */
    public static readonly GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;

    /** PVRTC 2 bits per pixel, RGB */
    public static readonly GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;

    /** PVRTC 4 bits per pixel, RGBA */
    public static readonly GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;

    /** PVRTC 2 bits per pixel, RGBA */
    public static readonly GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;
}