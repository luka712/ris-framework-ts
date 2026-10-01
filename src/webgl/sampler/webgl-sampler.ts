import { SamplerCompareFunction } from "../../common/sampler-enums";
import { SamplerDescriptor } from "../../core/rendering/sampler/sampler-descriptor";
import { WebGlUtilities } from "../utilities/WebGlUtilities.ts";
import type { WebGlGraphicsDevice } from "../WebGlGraphicsDevice.ts";
import {type ISampler, MipMapSamplerFilter, SamplerAddressMode, SamplerFilter} from "ris-framework-api";

/**
 * The WebGL implementation of the ISampler interface.
 */
export class WebGlSampler implements ISampler {

    private static _id: number = 0;
    private readonly _gl: WebGL2RenderingContext;
    private _minFilter = SamplerFilter.NEAREST;
    private _magFilter = SamplerFilter.NEAREST;
    private _mipMapFilter = MipMapSamplerFilter.NONE;
    private _addressModueU = SamplerAddressMode.CLAMP_TO_EDGE
    private _addressModueV = SamplerAddressMode.CLAMP_TO_EDGE;
    private _addressModueW = SamplerAddressMode.CLAMP_TO_EDGE;

    /**
     * Creates an instance of WebGlSampler.
     * @param graphicsDevice The WebGL graphics device that will be used to create the sampler. The graphics device provides access to the WebGL rendering context and other resources needed for creating and managing the sampler.
     * @param descriptor The descriptor containing configuration details for the sampler. This parameter is optional, and if not provided, default values will be used for the sampler configuration. The descriptor allows you to specify various properties of the sampler, such as filtering methods and address modes, which determine how textures are sampled in the shader.
     */
    constructor(graphicsDevice: WebGlGraphicsDevice, descriptor?: SamplerDescriptor) {

        this._gl = graphicsDevice.gl;

        descriptor = descriptor ?? new SamplerDescriptor();

        this.id = WebGlSampler._id++;
        this._minFilter = descriptor.minFilter;
        this._magFilter = descriptor.magFilter;
        this._mipMapFilter = descriptor.mipMapFilter;
        this._addressModueU = descriptor.addressModeU;
        this._addressModueV = descriptor.addressModeV;
        this._addressModueW = descriptor.addressModeW;

        this._createSampler();
    }

    /** @inheritDoc */
    readonly id: number;

    /** @inheritdoc */
    public get minFilter() {
        return this._minFilter;
    }

    /** @inheritdoc */
    public get magFilter() {
        return this._magFilter;
    }

    /** @inheritdoc */
    public get mipmapFilter()  {
        return this._mipMapFilter;
    }

    /** @inheritdoc */
    public get addressModeU() {
        return this._addressModueU;
    }

    /** @inheritdoc */
    public get addressModeV() {
        return this._addressModueV;
    }

    /** @inheritdoc */
    public get addressModeW() {
        return this._addressModueW;
    }

    /** @inheritdoc */
    public get handle(): any {
        return this.glSampler;
    }

    /**
     * The handle of the sampler. 
     * This is used to bind the sampler to the graphics pipeline.
     */
    public glSampler: globalThis.WebGLSampler = null!;

    /** @inheritdoc */
    public _createSampler(): void {

        this.glSampler = WebGlUtilities.sampler.create(this._gl,
            this._minFilter,
            this._magFilter,
            this._mipMapFilter,
            this._addressModueU,
            this._addressModueV,
            this._addressModueW,
            SamplerCompareFunction.Never,
            1,
        );
    }

    /** @inheritdoc */
    public dispose(): void {
        if (this.glSampler) {
            this._gl.deleteSampler(this.glSampler);
            this.glSampler = null!;
        }
    }

}