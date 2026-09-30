import {SamplerFilter} from "./SamplerFilter";
import {MipMapSamplerFilter} from "./MipMapSamplerFilter";
import {IDisposable} from "../../core/IDisposable";
import {SamplerAddressMode} from "./SamplerAddressMode";

/**
 * The sampler is used to sample textures in shaders.
 * It defines how the texture is sampled, such as the filtering mode and the address mode.
 */
export interface ISampler extends IDisposable {

/**
 * The id of a sampler.
 */
  readonly id: number;

/**
 * The min filter of the sampler.
 */
  readonly minFilter: SamplerFilter;

/**
 * The mag filter of the sampler.
 */
  readonly magFilter: SamplerFilter;

/**
 * The mipmap filter of the sampler.
 */
  readonly mipmapFilter: MipMapSamplerFilter;

/**
 * The address mode of the sampler for the U coordinate.
 */
  readonly addressModeU: SamplerAddressMode;

/**
 * The address mode of the sampler for the V coordinate.
 */
  readonly addressModeV: SamplerAddressMode;

/**
 * The address mode of the sampler for the W coordinate.
 */
  readonly addressModeW: SamplerAddressMode;

/**
 * The underlying handle of the sampler, specific to the graphics API being used (e.g., OpenGL, DirectX, Vulkan, WebGPU).
 */
  readonly handle: any;

}
