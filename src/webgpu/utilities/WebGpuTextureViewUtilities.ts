/** The WebGPU texture view utilities. */
export class WebGpuTextureViewUtilities {

    /**
     * Creates a texture view.
     * @param texture The texture.
     * @param descriptor The view descriptor. If not set, the default view of the whole texture is created.
     * @returns The texture view.
     */
    public create(texture: GPUTexture, descriptor?: GPUTextureViewDescriptor): GPUTextureView {
        return texture.createView(descriptor);
    }

    /**
     * Creates a 2D texture view.
     * @param texture The texture.
     * @param format The view format.
     * @param label The label.
     * @returns The texture view.
     */
    public create2D(texture: GPUTexture, format?: GPUTextureFormat, label?: string): GPUTextureView {
        return texture.createView({label, format, dimension: "2d"});
    }

    /**
     * Creates a 2D array texture view (`dimension: "2d-array"`) of every layer and mip level.
     * @param texture The texture, created with `dimension: "2d"` and one or more array layers.
     * @param format The view format. By default, the texture's format.
     * @param label The label. By default, none.
     * @returns The texture view.
     */
    public create2DArray(texture: GPUTexture, format?: GPUTextureFormat, label?: string): GPUTextureView {
        return texture.createView({label, format, dimension: "2d-array"});
    }

    /**
     * Creates a cube texture view.
     * @param texture The texture with 6 layers.
     * @param label The label.
     * @returns The texture view.
     */
    public createCubeTextureView(texture: GPUTexture, label?: string): GPUTextureView {
        return texture.createView({label, dimension: "cube", arrayLayerCount: 6});
    }
}
