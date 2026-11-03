import { AWebGpuLoggingUtilities } from "./WebGpuLogger.ts";

/** The WebGPU texture utilities. */
export class WebGpuTextureUtilities extends AWebGpuLoggingUtilities {

    /**
     * Rounds a size up to whole blocks. WebGPU requires a compressed texture's base size to be a multiple of its block size.
     * @param width The width.
     * @param height The height.
     * @param blockWidth The block width.
     * @param blockHeight The block height.
     * @returns The block-aligned [width, height].
     */
    public alignSizeToBlock(width: number, height: number, blockWidth: number, blockHeight: number): [number, number] {
        return [Math.ceil(width / blockWidth) * blockWidth, Math.ceil(height / blockHeight) * blockHeight];
    }

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
            size: { width, height, depthOrArrayLayers: 1 },
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

        const destination: GPUTexelCopyTextureInfo = {
            texture,
            mipLevel
        };

        const dataLayout: GPUTexelCopyBufferLayout = {
            bytesPerRow: width * bytesPerPixel,
            rowsPerImage: height
        };

        const size: GPUExtent3D = {
            width, height
        };

        queue.writeTexture(
            destination,
            data as ArrayBufferView<ArrayBuffer>,
            dataLayout,
            size);
    }

    /**
     * Writes block-compressed data (BC, ETC2, ASTC, ...) to a texture mip level.
     * @param queue The queue.
     * @param texture The texture.
     * @param data The data.
     * @param width The width of the level in pixels.
     * @param height The height of the level in pixels.
     * @param blockWidth The block width in pixels.
     * @param blockHeight The block height in pixels.
     * @param bytesPerBlock The bytes per block.
     * @param mipLevel The mip level. By default, 0.
     */
    public writeCompressedToTexture(queue: GPUQueue,
        texture: GPUTexture,
        data: ArrayBufferView,
        width: number,
        height: number,
        blockWidth: number,
        blockHeight: number,
        bytesPerBlock: number,
        mipLevel: number = 0): void {

        const blocksWide = Math.ceil(width / blockWidth);
        const blocksHigh = Math.ceil(height / blockHeight);

        const destination: GPUTexelCopyTextureInfo = {
            texture,
            mipLevel
        };

        const dataLayout: GPUTexelCopyBufferLayout = {
            bytesPerRow: blocksWide * bytesPerBlock,
            rowsPerImage: blocksHigh
        };

        const size: GPUExtent3D = {
            width: blocksWide * blockWidth,
            height: blocksHigh * blockHeight
        };

        // The copy size must cover whole blocks.
        queue.writeTexture(
            destination,
            data as ArrayBufferView<ArrayBuffer>,
            dataLayout,
            size);
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
        queue.copyExternalImageToTexture({ source: image }, { texture }, { width, height });
    }

    /**
     * Disposes the texture.
     * @param texture The texture.
     */
    public dispose(texture: GPUTexture | null | undefined): void {
        texture?.destroy();
    }
}
