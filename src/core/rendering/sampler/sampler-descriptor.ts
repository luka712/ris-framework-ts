import {MipMapSamplerFilter, SamplerAddressMode, SamplerFilter} from "ris-framework-api";

export class SamplerDescriptor {
    /**
     * The minification filter.
     */
    public minFilter: SamplerFilter = SamplerFilter.NEAREST;

    /**
     * The magnification filter.
     */
    public magFilter: SamplerFilter = SamplerFilter.NEAREST;

    /**
     * The mipmap filter.
     */
    public mipMapFilter: MipMapSamplerFilter = MipMapSamplerFilter.NONE;

    /**
     * The address mode for the U coordinate.
     */
    public addressModeU: SamplerAddressMode = SamplerAddressMode.CLAMP_TO_EDGE;

    /**
     * The address mode for the V coordinate.
     */
    public addressModeV: SamplerAddressMode = SamplerAddressMode.CLAMP_TO_EDGE;

    /**
     * The address mode for the W coordinate.
     */
    public addressModeW: SamplerAddressMode = SamplerAddressMode.CLAMP_TO_EDGE;
}