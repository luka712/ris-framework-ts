import { vec2 } from "gl-matrix";
import { AlignUtilities, TextureFormat, TextureUsage, TextureUtilities } from "../../api/_export.ts";
import { WebGpuConverter } from "./WebGpuConverter.ts";
import { AWebGpuLoggingUtilities } from "./WebGpuLogger.ts";

/** The result of texture creation. */
export interface WebGpuCreateTextureResult {
    /** The texture. */
    texture: GPUTexture,

    /** 
     * The extent of texture. Dimensions of texture do not have to match passed in dimensions,
     * as texture can be aligned to block size for block compressed formats.
     */
    size: GPUExtent3DDict
}

/** The WebGPU texture utilities. */
export class WebGpuTextureUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a 2D texture and, if data is given, uploads it.
     * @param device The device.
     * @param size The size [width, height] in pixels.
     * @param format The texture format.
     * @param usage The texture usage, used as-is. Uploading bytes needs `COPY_DST`;
     * uploading images needs `COPY_DST` and `RENDER_ATTACHMENT`.
     * @param data The data per mip level, as bytes or images. Level `i` goes to mip level `i`. By default, none (nothing is uploaded).
     * @param mipLevelCount The mip level count. By default, 1.
     * @param sampleCount The sample count. By default, 1. Used for MSAA.
     * @param label The label. By default, none.
     * @param viewFormats The formats views of this texture may use (`GPUTextureDescriptor.viewFormats`), e.g. the sRGB
     * variant of a linear format. In WebGPU they may only differ from `format` in sRGB-ness. By default, none (only `format`).
     * @returns The texture.
     */
    public create(device: GPUDevice,
        size: vec2,
        format: TextureFormat,
        usage: TextureUsage,
        data?: Uint8Array[] | HTMLImageElement[],
        mipLevelCount: number = 1,
        sampleCount: number = 1,
        label?: string,
        viewFormats?: TextureFormat[]): GPUTexture {

        const gpuTextureFormat = WebGpuConverter.convertTextureFormat(format);
        const gpuTextureUsage = WebGpuConverter.convertTextureUsage(usage);

        const tex = this.withValidation(device, "Texture", label, () => device.createTexture({
            label,
            size: { width: size[0], height: size[1], depthOrArrayLayers: 1 },
            mipLevelCount,
            sampleCount,
            format: gpuTextureFormat,
            usage: gpuTextureUsage,
            viewFormats: this._convertViewFormats(format, viewFormats),
        }));

        if (data && data.length > 0) {
            if (typeof HTMLImageElement !== "undefined" && data[0] instanceof HTMLImageElement) {
                this.writeImagesToTexture(device.queue, tex, data as HTMLImageElement[]);
            }
            else {
                const bytesPerPixel = TextureUtilities.getVRamSize(format, 1, 1);
                const levels = data as Uint8Array[];
                for (let level = 0; level < levels.length; level++) {
                    const width = Math.max(1, size[0] >> level);
                    const height = Math.max(1, size[1] >> level);
                    this.writeToTexture(device.queue, tex, vec2.fromValues(width, height), levels[level], bytesPerPixel, level);
                }
            }
        }

        return tex;
    }

    /**
     * Creates a block-compressed 2D texture (BC, ETC2, ASTC, ...) and uploads its mip levels.
     * The texture size is rounded up to whole blocks, as WebGPU requires (e.g. ASTC 10x5 at 768x512 -> 770x515).
     * @param device The device.
     * @param size The size of the data [width, height] in pixels.
     * @param blockSize The block size [width, height] in pixels.
     * @param format The texture format.
     * @param usage The texture usage, used as-is. Must include `COPY_DST` when there is data to upload.
     * @param data The data per mip level. By default, none (nothing is uploaded).
     * @param mipLevelCount The mip level count. By default, 1.
     * @param sampleCount The sample count. By default, 1. Used for MSAA.
     * @param label The label. By default, none.
     * @param viewFormats The formats views of this texture may use (`GPUTextureDescriptor.viewFormats`).
     * In WebGPU they may only differ from `format` in sRGB-ness. By default, none (only `format`).
     * @returns The texture and its block-aligned size.
     */
    public createCompressedTexture(
        device: GPUDevice,
        size: vec2,
        blockSize: vec2,
        format: TextureFormat,
        usage: TextureUsage,
        data?: Uint8Array[],
        mipLevelCount: number = 1,
        sampleCount: number = 1,
        label?: string,
        viewFormats?: TextureFormat[]): WebGpuCreateTextureResult {

        const hasData = !!data && data.length > 0;

        const alignedWidth = AlignUtilities.align(size[0], blockSize[0]);
        const alignedHeight = AlignUtilities.align(size[1], blockSize[1]);

        const gpuTextureFormat = WebGpuConverter.convertTextureFormat(format);
        const gpuTextureUsage = WebGpuConverter.convertTextureUsage(usage);

        const extentSize: GPUExtent3DDict = {
            width: alignedWidth,
            height: alignedHeight,
            depthOrArrayLayers: 1
        };

        const tex = this.withValidation(device, "Texture", label, () => device.createTexture({
            label,
            size: extentSize,
            mipLevelCount,
            sampleCount,
            format: gpuTextureFormat,
            usage: gpuTextureUsage,
            viewFormats: this._convertViewFormats(format, viewFormats),
        }));

        if (hasData) {
            const bytesPerBlock = TextureUtilities.getVRamSize(format, blockSize[0], blockSize[1]);

            // Each mip copy uses that mip's size, rounded up to whole blocks, which stays inside the block-aligned GPU texture.
            for (let i = 0; i < data!.length; i++) {
                const mipWidth = Math.max(1, size[0] >> i);
                const mipHeight = Math.max(1, size[1] >> i);

                this.writeCompressedToTexture(
                    device.queue, tex,
                    vec2.fromValues(mipWidth, mipHeight), blockSize,
                    data![i], bytesPerBlock, i);
            }
        }

        return {
            texture: tex,
            size: extentSize
        };
    }

    /**
     * Creates a depth texture, usable as a render attachment.
     * @param device The device.
     * @param size The size [width, height].
     * @param format The depth format. By default, `TextureFormat.DEPTH24_PLUS_STENCIL8`.
     * @param label The label. By default, none.
     * @returns The texture.
     */
    public createDepthTexture(device: GPUDevice, size: vec2,
        format: TextureFormat = TextureFormat.DEPTH24_PLUS_STENCIL8, label?: string): GPUTexture {
        return this.create(device, size, format, TextureUsage.RENDER_ATTACHMENT, undefined, 1, 1, label);
    }

    /**
     * Writes data to a texture mip level.
     * @param queue The queue.
     * @param texture The texture.
     * @param size The size of the mip level [width, height] in pixels.
     * @param data The data.
     * @param bytesPerPixel The bytes per pixel. By default, 4 (RGBA8).
     * @param mipLevel The mip level. By default, 0.
     */
    public writeToTexture(queue: GPUQueue,
        texture: GPUTexture,
        size: vec2,
        data: ArrayBufferView,
        bytesPerPixel: number = 4,
        mipLevel: number = 0): void {

        const destination: GPUTexelCopyTextureInfo = {
            texture,
            mipLevel
        };

        const dataLayout: GPUTexelCopyBufferLayout = {
            bytesPerRow: size[0] * bytesPerPixel,
            rowsPerImage: size[1]
        };

        const extent: GPUExtent3D = {
            width: size[0],
            height: size[1]
        };

        queue.writeTexture(
            destination,
            data as ArrayBufferView<ArrayBuffer>,
            dataLayout,
            extent);
    }

    /**
     * Writes block-compressed data (BC, ETC2, ASTC, ...) to a texture mip level.
     * @param queue The queue.
     * @param texture The texture.
     * @param size The size of the mip level [width, height] in pixels.
     * @param blockSize The block size [width, height] in pixels.
     * @param data The data.
     * @param bytesPerBlock The bytes per block.
     * @param mipLevel The mip level. By default, 0.
     */
    public writeCompressedToTexture(queue: GPUQueue,
        texture: GPUTexture,
        size: vec2,
        blockSize: vec2,
        data: ArrayBufferView,
        bytesPerBlock: number,
        mipLevel: number = 0): void {

        const blocksWide = Math.ceil(size[0] / blockSize[0]);
        const blocksHigh = Math.ceil(size[1] / blockSize[1]);

        const destination: GPUTexelCopyTextureInfo = {
            texture,
            mipLevel
        };

        const dataLayout: GPUTexelCopyBufferLayout = {
            bytesPerRow: blocksWide * bytesPerBlock,
            rowsPerImage: blocksHigh
        };

        const extent: GPUExtent3D = {
            width: blocksWide * blockSize[0],
            height: blocksHigh * blockSize[1]
        };

        // The copy size must cover whole blocks.
        queue.writeTexture(
            destination,
            data as ArrayBufferView<ArrayBuffer>,
            dataLayout,
            extent);
    }

    /**
     * Copies the images arranged as mip levels to the texture. Image `i` goes to mip level `i`.
     * The texture needs `COPY_DST` and `RENDER_ATTACHMENT` usage.
     * @param queue The queue.
     * @param texture The texture.
     * @param imagesPerMip The image per mip.
     */
    public writeImagesToTexture(queue: GPUQueue, texture: GPUTexture, imagesPerMip: HTMLImageElement[]): void {

        for (let i = 0; i < imagesPerMip.length; i++) {
            const image = imagesPerMip[i];
            const source: GPUCopyExternalImageSourceInfo = {
                source: image,
            };
            const dest: GPUCopyExternalImageDestInfo = {
                texture,
                mipLevel: i
            };
            const size: GPUExtent3DStrict = {
                width: image.width,
                height: image.height
            }
            queue.copyExternalImageToTexture(source, dest, size);
        }
    }

    /**
     * Disposes the texture.
     * @param texture The texture.
     */
    public dispose(texture: GPUTexture | null | undefined): void {
        texture?.destroy();
    }

    /**
     * Converts the extra view formats to `GPUTextureDescriptor.viewFormats`, skipping the texture's own format
     * (always allowed). Returns undefined when there is no other view format.
     */
    private _convertViewFormats(format: TextureFormat, viewFormats?: TextureFormat[]): GPUTextureFormat[] | undefined {
        const other = (viewFormats ?? []).filter(f => f != format);
        return other.length > 0 ? other.map(f => WebGpuConverter.convertTextureFormat(f)) : undefined;
    }

}
