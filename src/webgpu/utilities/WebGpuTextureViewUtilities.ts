import type { ITextureViewDescriptor } from "../../api/index.ts";
import { WebGpuConverter } from "./WebGpuConverter.ts";

/** The WebGPU texture view utilities. */
export class WebGpuTextureViewUtilities {

    /**
     * Creates a texture view.
     * @param texture The texture.
     * @param descriptor The view descriptor. If not set, the default view of the whole texture is created.
     * @returns The texture view.
     */
    public create(texture: GPUTexture, descriptor?: ITextureViewDescriptor): GPUTextureView {
        if (!descriptor) {
            return texture.createView();
        }

        const desc: GPUTextureViewDescriptor = {};
        if (descriptor.viewFormat !== undefined) {
            desc.format = WebGpuConverter.convertTextureFormat(descriptor.viewFormat);
        }
        if (descriptor.dimension !== undefined) {
            desc.dimension = WebGpuConverter.convertTextureViewDimension(descriptor.dimension);
        }
        if (descriptor.label !== undefined) {
            desc.label = descriptor.label;
        }
        if (descriptor.baseMipLevel !== undefined) {
            desc.baseMipLevel = descriptor.baseMipLevel;
        }
        if (descriptor.mipLevelCount !== undefined) {
            desc.mipLevelCount = descriptor.mipLevelCount;
        }
        if (descriptor.baseArrayLayer !== undefined) {
            desc.baseArrayLayer = descriptor.baseArrayLayer;
        }
        if (descriptor.arrayLayerCount !== undefined) {
            desc.arrayLayerCount = descriptor.arrayLayerCount;
        }
        return texture.createView(desc);
    }
}
