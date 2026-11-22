/**
 * The GPU limits of a graphics device.
 */
export class GpuLimits {

    /**
     * The constructor.
     * @param _maxTextureDimension2D The maximum 2D texture size in pixels (`GPUDevice.limits.maxTextureDimension2D` / `MAX_TEXTURE_SIZE`).
     * @param _maxTextureDimension3D The maximum 3D texture size in pixels (`GPUDevice.limits.maxTextureDimension3D` / `MAX_3D_TEXTURE_SIZE`).
     * @param _maxTextureArrayLayers The maximum number of 2D array layers (`GPUDevice.limits.maxTextureArrayLayers` / `MAX_ARRAY_TEXTURE_LAYERS`).
     * @param _maxUniformBufferBindingSize The maximum uniform buffer binding size in bytes (`GPUDevice.limits.maxUniformBufferBindingSize` / `MAX_UNIFORM_BLOCK_SIZE`).
     * @param _maximumAnisotropyLevel The maximum anisotropic filtering level. On WebGPU this is 16 (the API maximum); on WebGL2 it comes from `EXT_texture_filter_anisotropic`, or 1 when the extension is missing.
     */
    constructor(
        private readonly _maxTextureDimension2D: number,
        private readonly _maxTextureDimension3D: number,
        private readonly _maxTextureArrayLayers: number,
        private readonly _maxUniformBufferBindingSize: number,
        private readonly _maximumAnisotropyLevel: number,
    ) {
    }

    /**
     * Builds limits from a WebGPU device (`GPUDevice.limits`).
     * {@link maximumAnisotropyLevel} is 16, the maximum `maxAnisotropy` allowed by the WebGPU API.
     * @param device The initialized WebGPU device.
     * @returns The limits.
     */
    public static fromWebGpuDevice(device: GPUDevice): GpuLimits {
        const limits = device.limits;
        return new GpuLimits(
            limits.maxTextureDimension2D,
            limits.maxTextureDimension3D,
            limits.maxTextureArrayLayers,
            limits.maxUniformBufferBindingSize,
            16,
        );
    }

    /**
     * Builds limits from a WebGL2 context (`gl.getParameter`).
     * {@link maximumAnisotropyLevel} comes from `EXT_texture_filter_anisotropic` (`MAX_TEXTURE_MAX_ANISOTROPY_EXT`), or 1 when the extension is missing.
     * @param gl The WebGL2 context.
     * @returns The limits.
     */
    public static fromWebGlContext(gl: WebGL2RenderingContext): GpuLimits {
        const ext = gl.getExtension("EXT_texture_filter_anisotropic")
            ?? gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
        const anisotropy = ext ? Number(gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 1;
        return new GpuLimits(
            Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)),
            Number(gl.getParameter(gl.MAX_3D_TEXTURE_SIZE)),
            Number(gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS)),
            Number(gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE)),
            anisotropy,
        );
    }

    /** The maximum width or height of a 2D texture, in pixels. */
    public get maxTextureDimension2D(): number {
        return this._maxTextureDimension2D;
    }

    /** The maximum width, height or depth of a 3D texture, in pixels. */
    public get maxTextureDimension3D(): number {
        return this._maxTextureDimension3D;
    }

    /** The maximum number of layers in a 2D texture array. */
    public get maxTextureArrayLayers(): number {
        return this._maxTextureArrayLayers;
    }

    /** The maximum uniform buffer binding size, in bytes. */
    public get maxUniformBufferBindingSize(): number {
        return this._maxUniformBufferBindingSize;
    }

    /**
     * The maximum anisotropy level supported for texture sampling.
     * On WebGPU this is 16 (the API maximum). On WebGL2 it is `MAX_TEXTURE_MAX_ANISOTROPY_EXT`, or 1 when anisotropic filtering is not available.
     */
    public get maximumAnisotropyLevel(): number {
        return this._maximumAnisotropyLevel;
    }
}
