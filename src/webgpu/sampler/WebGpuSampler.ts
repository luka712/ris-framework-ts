import {SamplerDescriptor} from "../../core/rendering/sampler/sampler-descriptor.ts";
import {type ISampler, MipMapSamplerFilter} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * The WebGPU sampler.
 * @internal
 */
export class WebGpuSampler implements ISampler {

    private static _nextId = 0;

    private _gpuSampler: GPUSampler | null;

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param descriptor The sampler descriptor.
     */
    public constructor(graphicsDevice: WebGpuGraphicsDevice, descriptor?: SamplerDescriptor) {
        descriptor = descriptor ?? new SamplerDescriptor();
        this.id = WebGpuSampler._nextId++;
        this.minFilter = descriptor.minFilter;
        this.magFilter = descriptor.magFilter;
        this.mipmapFilter = descriptor.mipMapFilter;
        this.addressModeU = descriptor.addressModeU;
        this.addressModeV = descriptor.addressModeV;
        this.addressModeW = descriptor.addressModeW;

        this._gpuSampler = WebGpuUtilities.sampler.create(graphicsDevice.device, {
            label: `WebGpuSampler ${this.id}`,
            minFilter: WebGpuConverter.convertFilter(this.minFilter),
            magFilter: WebGpuConverter.convertFilter(this.magFilter),
            mipmapFilter: WebGpuConverter.convertMipMapFilter(this.mipmapFilter),
            addressModeU: WebGpuConverter.convertAddressMode(this.addressModeU),
            addressModeV: WebGpuConverter.convertAddressMode(this.addressModeV),
            addressModeW: WebGpuConverter.convertAddressMode(this.addressModeW),
            // Without mip filtering only the base level is sampled.
            lodMaxClamp: this.mipmapFilter === MipMapSamplerFilter.NONE ? 0 : 32,
        });
    }

    /** @inheritDoc */
    public readonly id: number;

    /** @inheritDoc */
    public readonly minFilter;

    /** @inheritDoc */
    public readonly magFilter;

    /** @inheritDoc */
    public readonly mipmapFilter;

    /** @inheritDoc */
    public readonly addressModeU;

    /** @inheritDoc */
    public readonly addressModeV;

    /** @inheritDoc */
    public readonly addressModeW;

    /** The WebGPU sampler. */
    public get gpuSampler(): GPUSampler {
        if (!this._gpuSampler) {
            throw new Error("WebGpuSampler: the sampler is disposed.");
        }
        return this._gpuSampler;
    }

    /** @inheritDoc */
    public get handle(): any {
        return this._gpuSampler;
    }

    /** @inheritDoc */
    public dispose(): void {
        // WebGPU samplers have no destroy(); dropping the reference lets the browser collect it.
        this._gpuSampler = null;
    }
}
