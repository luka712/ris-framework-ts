
/**
 * The preset for texture sampler filtering.
 * This is used to configure the default texture sampler in the graphics device.
 *  The default texture sampler is used when a texture is sampled without a specific sampler being bound.
 */
export enum TextureSamplerFilteringPreset {
    /**
     * Point filtering preset. This will configure the texture sampler to use point filtering for minification and magnification, and no mipmapping.
     */
    POINT,

    /**
     * Bilinear filtering preset. This will configure the texture sampler to use bilinear filtering for minification and magnification, and no mipmapping.
     */
    BILINEAR,

    /**
     * Trilinear filtering preset. This will configure the texture sampler to use bilinear filtering for minification and magnification, and linear mipmapping.
     */
    TRILINEAR
}
