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
     * Creates a cube texture view.
     * @param texture The texture with 6 layers.
     * @param label The label.
     * @returns The texture view.
     */
    public createCubeTextureView(texture: GPUTexture, label?: string): GPUTextureView {
        return texture.createView({label, dimension: "cube", arrayLayerCount: 6});
    }
}
