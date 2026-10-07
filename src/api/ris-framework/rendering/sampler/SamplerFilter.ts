/**
 * The sampler filter.
 */
export enum SamplerFilter {
/**
 * The nearest filtering method. The texture will be sampled using the value of the nearest texel.
 */
  NEAREST = 0,
/**
 * The linear filtering method. The texture will be sampled using the weighted average of the four nearest texels.
 */
  LINEAR = 1
}
