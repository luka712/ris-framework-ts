/**
 * The mipmap sampler filter.
 */
export enum MipMapSamplerFilter {
/**
 * Mipmap filtering is disabled. The mipmap level 0 will be used for sampling.
 */
  NONE = 0,
/**
 * The nearest mipmap filtering method. The mipmap level will be selected using the value of the nearest mipmap level.
 */
  NEAREST = 1,
/**
 * The linear mipmap filtering method. The mipmap level will be selected using the weighted average of the two nearest mipmap levels.
 */
  LINEAR = 2
}
