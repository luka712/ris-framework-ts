/**
 * The address mode of the sampler.
 */
export enum SamplerAddressMode {
/**
 * The repeat address mode.
 *     The texture will be repeated when the texture coordinates are outside the range [0, 1].
 */
  REPEAT = 0,
/**
 * The mirror repeat address mode.
 */
  MIRROR_REPEAT = 1,
/**
 * The clamp to edge address mode.
 */
  CLAMP_TO_EDGE = 2,
/**
 * The clamp to border address mode. 
 *     The texture will be clamped to a border color when the texture coordinates are outside the range [0, 1].
 */
  CLAMP_TO_BORDER = 3
}
