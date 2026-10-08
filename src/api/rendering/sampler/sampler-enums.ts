

/**
 * The compare function to use when sampling a texture. This is used for depth textures and determines how the sampled depth value is compared to the reference value.
 */
export enum SamplerCompareFunction {

    /**
     * The comparison never passes.
     * WebGlSamplerUtilities treats this value as "no comparison" and leaves TEXTURE_COMPARE_MODE at NONE.
     */
    Never,

    /**
     * The comparison passes if the reference value is less than or equal to the sampled depth value.
     */
    LessEqual,


}
