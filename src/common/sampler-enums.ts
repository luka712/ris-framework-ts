

/**
 * The compare function to use when sampling a texture. This is used for depth textures and determines how the sampled depth value is compared to the reference value.
 */
export enum SamplerCompareFunction {

    /**
     * The sampled depth value is never less than the reference value. 
     * This means that the comparison will always fail, and the texture will not contribute to the final image.
     */
    Never,

    /**
     * The sampled depth value is less than the reference value. 
     * This means that the comparison will pass if the sampled depth value is less than the reference value, and the texture will contribute to the final image.
     */
    LessEqual,


}
