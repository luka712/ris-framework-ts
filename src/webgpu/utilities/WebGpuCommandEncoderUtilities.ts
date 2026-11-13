/** The WebGPU command encoder utilities. */
export class WebGpuCommandEncoderUtilities {

    /**
     * Creates a command encoder.
     * @param device The device.
     * @param label The label.
     */
    public create(device: GPUDevice, label?: string): GPUCommandEncoder {
        return device.createCommandEncoder({label});
    }

    /**
     * Finishes the encoder and submits it to the device queue.
     * @param device The device.
     * @param encoder The command encoder.
     */
    public submit(device: GPUDevice, encoder: GPUCommandEncoder): void {
        device.queue.submit([encoder.finish()]);
    }

    /**
     * Copies a texture to a buffer.
     * @param encoder The command encoder.
     * @param texture The source texture.
     * @param buffer The destination buffer. Needs COPY_DST.
     * @param width The width.
     * @param height The height.
     * @param bytesPerPixel The bytes per pixel. By default, 4.
     */
    public copyTextureToBuffer(encoder: GPUCommandEncoder, texture: GPUTexture, buffer: GPUBuffer,
                               width: number, height: number, bytesPerPixel: number = 4): void {
        // bytesPerRow must be a multiple of 256.
        const bytesPerRow = Math.ceil(width * bytesPerPixel / 256) * 256;
        encoder.copyTextureToBuffer({texture}, {buffer, bytesPerRow, rowsPerImage: height}, {width, height});
    }
}
