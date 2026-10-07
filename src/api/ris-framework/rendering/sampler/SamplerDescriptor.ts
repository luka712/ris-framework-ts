import {SamplerAddressMode} from "./SamplerAddressMode";
import {SamplerFilter} from "./SamplerFilter";
import {MipMapSamplerFilter} from "./MipMapSamplerFilter";

/**
 * The descriptor for creating a sampler.
 * It contains the parameters for creating a sampler, such as the address mode and filter mode.
 */
export class SamplerDescriptor {

    /**
     * The address mode for U coordinate.
     * It determines how texture coordinates outside the [0, 1] range are handled in the U direction.
     */
    public addressModeU = SamplerAddressMode.REPEAT;

    /**
     * The address mode for V coordinate.
     * It determines how texture coordinates outside the [0, 1] range are handled in the V direction.
     */
    public addressModeV = SamplerAddressMode.REPEAT;

    /**
     * The address mode for W coordinate.
     * It determines how texture coordinates outside the [0, 1] range are handled in the W direction.
     */
    public addressModeW = SamplerAddressMode.REPEAT;

    /**
     * The minification filter of the sampler.
     * It determines how the texture is sampled when it is minified (i.e., when the texture is smaller than the area it is being mapped to).
     */
    public minFilter = SamplerFilter.LINEAR;

    /**
     * The magnification filter of the sampler.
     * It determines how the texture is sampled when it is magnified (i.e., when the texture is larger than the area it is being mapped to).
     */
    public magFilter = SamplerFilter.LINEAR;

    /**
     * The mipmap filter of the sampler.
     * It determines how the texture is sampled when mipmapping is used (i.e., when the texture has multiple levels of detail).
     */
    public mipMapFilter = MipMapSamplerFilter.NONE;
}
