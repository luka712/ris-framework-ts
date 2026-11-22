/** The WebGPU bind group layout entry utilities. */
export class WebGpuBindGroupLayoutEntryUtilities {

    /**
     * Creates a texture entry.
     * @param binding The binding.
     * @param visibility The `GPUShaderStage` flags.
     * @param sampleType The sample type. By default, `float`.
     * @param viewDimension The view dimension, e.g. `2d-array` for `texture_2d_array`. By default, `2d`.
     */
    public createTextureBindGroupLayoutEntry(binding: number, visibility: GPUShaderStageFlags, sampleType: GPUTextureSampleType = "float",
                                             viewDimension: GPUTextureViewDimension = "2d"): GPUBindGroupLayoutEntry {
        return {binding, visibility, texture: {sampleType, viewDimension}};
    }

    /**
     * Creates a storage texture entry.
     * @param binding The binding.
     * @param visibility The `GPUShaderStage` flags.
     * @param format The texture format.
     * @param access The access. By default, `write-only`.
     */
    public createTextureStorageBindGroupLayoutEntry(binding: number, visibility: GPUShaderStageFlags, format: GPUTextureFormat,
                                                    access: GPUStorageTextureAccess = "write-only"): GPUBindGroupLayoutEntry {
        return {binding, visibility, storageTexture: {format, access}};
    }

    /**
     * Creates a uniform buffer entry.
     * @param binding The binding.
     * @param visibility The `GPUShaderStage` flags.
     */
    public createUniformBufferBindGroupLayoutEntry(binding: number, visibility: GPUShaderStageFlags): GPUBindGroupLayoutEntry {
        return {binding, visibility, buffer: {type: "uniform"}};
    }

    /**
     * Creates a sampler entry.
     * @param binding The binding.
     * @param visibility The `GPUShaderStage` flags.
     * @param type The sampler type. By default, `filtering`.
     */
    public createSamplerBindGroupLayoutEntry(binding: number, visibility: GPUShaderStageFlags, type: GPUSamplerBindingType = "filtering"): GPUBindGroupLayoutEntry {
        return {binding, visibility, sampler: {type}};
    }
}
