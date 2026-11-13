import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The WebGPU sampler utilities. */
export class WebGpuSamplerUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a sampler.
     * @param device The device.
     * @param descriptor The sampler descriptor.
     * @returns The sampler.
     */
    public create(device: GPUDevice, descriptor: GPUSamplerDescriptor): GPUSampler {
        return this.withValidation(device, "Sampler", descriptor.label, () => device.createSampler(descriptor));
    }
}
