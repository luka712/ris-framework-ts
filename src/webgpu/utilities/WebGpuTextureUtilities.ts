import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The WebGPU texture utilities. */
export class WebGpuTextureUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a 2D texture.
     * @param device The device.
     * @param width The width.
     * @param height The height.
     * @param format The texture format.
     * @param usage The texture usage (`GPUTextureUsage` flags).
     * @param mipLevelCount The mip level count. By default, 1.
     * @param sampleCount The sample count. By default, 1. Used for MSAA.
     * @param label The label.
     * @returns The texture.
     */
    public create(device: GPUDevice,
                  width: number,
                  height: number,
                  format: GPUTextureFormat,
                  usage: GPUTextureUsageFlags,
                  mipLevelCount: number = 1,
                  sampleCount: number = 1,
                  label?: string): GPUTexture {
        return this.withValidation(device, "Texture", label, () => device.createTexture({
            label,
            size: {width, height, depthOrArrayLayers: 1},
            mipLevelCount,
            sampleCount,
            format,
            usage,
        }));
    }

    /**
     * Creates a depth texture, usable as a render attachment.
     * @param device The device.
     * @param width The width.
     * @param height The height.
     * @param format The depth format. By default, `depth24plus-stencil8`.
     * @param label The label.
     * @returns The texture.
     */
    public createDepthTexture(device: GPUDevice, width: number, height: number,
                              format: GPUTextureFormat = "depth24plus-stencil8", label?: string): GPUTexture {
        return this.create(device, width, height, format, GPUTextureUsage.RENDER_ATTACHMENT, 1, 1, label);
    }

    /**
     * Writes data to a texture mip level.
     * @param queue The queue.
     * @param texture The texture.
     * @param data The data.
     * @param width The width of the level.
     * @param height The height of the level.
     * @param bytesPerPixel The bytes per pixel. By default, 4 (RGBA8).
     * @param mipLevel The mip level. By default, 0.
     */
    public writeToTexture(queue: GPUQueue,
                          texture: GPUTexture,
                          data: ArrayBufferView,
                          width: number,
                          height: number,
                          bytesPerPixel: number = 4,
                          mipLevel: number = 0): void {
        queue.writeTexture(
            {texture, mipLevel},
            data as ArrayBufferView<ArrayBuffer>,
            {bytesPerRow: width * bytesPerPixel, rowsPerImage: height},
            {width, height});
    }

    /**
     * Copies an image to a texture. The texture needs COPY_DST and RENDER_ATTACHMENT usage.
     * @param queue The queue.
     * @param texture The texture.
     * @param image The image.
     * @param width The width.
     * @param height The height.
     */
    public writeImageToTexture(queue: GPUQueue, texture: GPUTexture, image: GPUCopyExternalImageSource, width: number, height: number): void {
        queue.copyExternalImageToTexture({source: image}, {texture}, {width, height});
    }

    /**
     * Disposes the texture.
     * @param texture The texture.
     */
    public dispose(texture: GPUTexture | null | undefined): void {
        texture?.destroy();
    }
}
