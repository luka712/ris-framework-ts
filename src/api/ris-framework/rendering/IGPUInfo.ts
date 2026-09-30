import {RenderingBackend} from "./RenderingBackend";
import {TextureFormat} from "./texture/TextureFormat";

/**
 * The GPU information. Contains the information about the GPU, such as the name, vendor, etc.
 */
export interface IGPUInfo {

    /**
     * The name of the GPU.
     */
    readonly name: string;

    /**
     * The vendor of the GPU.
     */
    readonly vendor: string;

    /**
     * The version of the GPU API.
     */
    readonly apiVersion: string;

    /**
     * The rendering backend used by the GPU. For example, DirectX 12, Vulkan, OpenGL, etc.
     */
    readonly api: RenderingBackend;

    /**
     * The underlying rendering backend used by the GPU.
     * This is the actual rendering backend used by the GPU, which may be different from the API.
     * For example, for WebGPU, the API is WebGPU, but the underlying backend can be DirectX 12, Vulkan, Metal, etc.
     */
    readonly underlyingBackend: RenderingBackend;

    /**
     * Gets the list of supported compressed texture formats by the GPU.
     * This can be used to determine which compressed texture formats can be used for texture compression, which can improve performance and reduce memory usage.
     */
    readonly supportedCompressedTextureFormats: TextureFormat[];

}
