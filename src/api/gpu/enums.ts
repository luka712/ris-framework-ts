/**
 * The color space used to interpret RGB texture components when sampled.
 * sRGB textures are automatically decoded to linear values by the GPU.
 * Alpha is always interpreted as linear.
 */
export enum ColorSpace {
    /** Linear RGB color space. */
    LINEAR = "LINEAR",

    /** sRGB-encoded RGB color space. */
    SRGB = "SRGB",
}
