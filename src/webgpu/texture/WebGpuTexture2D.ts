import {
    type IFramework,
    State,
    TextureUsage,
    TextureUtilities,
    TextureViewDimension,
    type ITextureView2D,
    type ITextureViewDescriptor,
    type ITextureDescriptor,
    TextureFormat,
} from "../../api/index.ts";
import { ATexture2D } from "../../api/gpu/texture/ATexture2D.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuTextureView } from "./WebGpuTextureView.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";
import { WebGpuDownsampleTextureComputePipeline } from "../compute/pipelines/WebGpuDownsampleTextureComputePipeline.ts";
import type { WebGpuCommandEncoder } from "../WebGpuCommandEncoder.ts";
import { ValidationUtilities } from "../../api/validation/ValidationUtilities.ts";

/**
 * The WebGPU 2D texture.
 *
 * Supports `Uint8Array` mip levels (uncompressed or compressed, e.g. from KTX2) or `HTMLImageElement` mip levels
 * (uncompressed only; needs `COPY_DST` and `RENDER_ATTACHMENT` usage).
 * `generateMipmaps` is implemented with a compute shader for `RGBA8_UNORM` and `RGBA8_UNORM_SRGB`.
 * Other formats throw. sRGB textures are written
 * through an `rgba8unorm` view (`rgba8unorm-srgb` cannot be a storage texture); the shader filters in linear space.
 * @internal
 */
export class WebGpuTexture2D extends ATexture2D {

    private readonly _framework: IFramework;
    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _gpuTexture: GPUTexture | null = null;
    private _commandEncoder: WebGpuCommandEncoder;

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The texture descriptor.
     */
    public constructor(framework: IFramework, descriptor: ITextureDescriptor) {

        if (descriptor.textureFormat && descriptor.textureUsage) {
            ValidationUtilities.validateTextureUsageTextureFormat(descriptor.textureUsage, descriptor.textureFormat);
        }

        const graphicsDevice = framework.graphicsDevice as WebGpuGraphicsDevice;
        super(graphicsDevice, descriptor);
        this._framework = framework;
        this._graphicsDevice = graphicsDevice;
        this._commandEncoder = (descriptor.commandEncoder ?? graphicsDevice.mainCommandEncoder) as WebGpuCommandEncoder;

        if (!this._label) {
            this._label = `WebGpuTexture2D ${this.id}`;
        }
    }

    /** The WebGPU texture. */
    public get gpuTexture(): GPUTexture {
        if (!this._gpuTexture) {
            throw new Error("WebGpuTexture2D: the texture is not initialized or is disposed.");
        }
        return this._gpuTexture;
    }

    /** The default WebGPU view of the whole texture, in the texture's own format. Same as `defaultTextureView.nativeObject`. */
    public get gpuDefaultView(): GPUTextureView {
        if (!this._gpuTexture) {
            throw new Error("WebGpuTexture2D: the texture is not initialized or is disposed.");
        }
        return (this.defaultTextureView as WebGpuTextureView).gpuTextureView;
    }

    /**
     * Creates the GPU texture and uploads every mip level.
     * @throws Error when the texture is already initialized or disposed,
     * mipmap generation is requested when compute is not supported or for an unsupported format,
     * the usage lacks `COPY_DST` (or `RENDER_ATTACHMENT` for images) while there is data to upload,
     * or a compressed format is given images.
     */
    public initialize(): void {
        this._validateState();

        this._state = State.INITIALIZED;

        const device = this._graphicsDevice.device;
        const isCompressed = TextureUtilities.isCompressedTextureFormat(this.textureFormat);
        const data = this._data;

        if (this._generateMipmaps) {
            this._mipLevels = TextureUtilities.mipLevels(this.size[0], this.size[1]);
        }

        if (isCompressed) {
            // Compressed formats need a block-aligned base size (e.g. ASTC 10x5 at 768x512 -> 770x515).
            const result = WebGpuUtilities.texture.createCompressedTexture(
                device,
                this._baseSize,
                this._blockSize,
                this.textureFormat,
                this.textureUsage,
                data as Uint8Array[] | undefined,
                this._mipLevels,
                1,
                this.label,
                this.viewFormats);

            this._gpuTexture = result.texture;
        }
        else {

            this._gpuTexture = WebGpuUtilities.texture.create(
                device,
                this._baseSize,
                this.textureFormat,
                this.textureUsage,
                data,
                this._mipLevels, 1,
                this.label,
                this.viewFormats);
        }

        this._handle = this._gpuTexture;

        if (this._generateMipmaps) {
            this._framework.dispatcher.addNextUpdateFrameAction(() => this._fillMipmaps());
        }

        let width = this.size[0];
        let height = this.size[1];
        this._vramSize = 0;
        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height);
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }
    }

    /**
     * Creates a native 2D view with `GPUTexture.createView`. The format is legal because the texture was created
     * with `GPUTextureDescriptor.viewFormats` set to {@link viewFormats} (e.g. RGBA8_UNORM with an RGBA8_UNORM_SRGB view).
     * @inheritDoc
     */
    protected _createTextureView(descriptor?: ITextureViewDescriptor): ITextureView2D {
        const desc = descriptor ? { ...descriptor } : {};
        desc.dimension = desc.dimension ?? TextureViewDimension.DIMENSION_2D;
        desc.viewFormat = desc.viewFormat ?? this.textureFormat;
        return new WebGpuTextureView(this._framework, this, desc);
    }

    /**
     * Generates the mip chain from mip level 0. Runs in the current compute pass.
     */
    private _fillMipmaps(): void {

        // We need encoder to encode commands that needs to be done.
        const encoder = this._graphicsDevice.createCommandEncoder("FillMipmaps Encoder");
        encoder.start();
        const downsampleComputePass = this._framework.computeContext!.createComputePass({
            commandEncoder: encoder,
            label: "Downsample Pass"
        });


        // Create staging texture optionally.
        let stagingTexture = this._framework.textureFactory.create({
            commandEncoder: encoder,
            width: this.size[0],
            height: this.size[1],
            label: "StagingTexture",
            textureFormat: TextureFormat.RGBA8_UNORM,
            textureUsage: TextureUsage.STORAGE_BINDING | TextureUsage.COPY_SRC,
            mipmapLevels: this.mipLevels
        }) as WebGpuTexture2D;


        const workgroupSize = 8;

        const source = this._createTextureView({
            viewFormat: this.textureFormat,
            baseMipLevel: 0,
            mipLevelCount: 1,
        });

        // Begin compute pass.
        downsampleComputePass.beginPass();

        for (let i = 0; i < this.mipLevels; i++) {

            const desc: ITextureViewDescriptor = {
                viewFormat: TextureFormat.RGBA8_UNORM,
                mipLevelCount: 1,
                baseMipLevel: i,
            };

            const destination = stagingTexture.createView(desc);
            const pipeline = this._framework.computePipelineFactory!.createDownsampleTexturePipeline(source, destination) as WebGpuDownsampleTextureComputePipeline;
            encoder.queueDispose(pipeline);

            pipeline.dispatchWorkgroup(
                Math.ceil(destination.size[0] / workgroupSize),
                Math.ceil(destination.size[1] / workgroupSize),
                1);
        }

        // End pass. It can be disposed when ended.
        downsampleComputePass.endPass();
        downsampleComputePass.dispose();

        // Submit everything to queue.
        encoder.submit();
        encoder.dispose();

        const commandEncoder = this._graphicsDevice.createCommandEncoder("GenerateMipmapsCopyBack") as WebGpuCommandEncoder;
        commandEncoder.start();

        for (let i = 1; i < this.mipLevels; i++) {

            const width = this.size[0] >> i;
            const height = this.size[1] >> i;

            // TODO: would be nice to capture this as a method of higher level command encoder.
            commandEncoder.gpuCommandEncoder!.copyTextureToTexture(
                { texture: stagingTexture.gpuTexture, mipLevel: i },
                { texture: this.gpuTexture, mipLevel: i },
                {
                    width,
                    height,
                    depthOrArrayLayers: 1
                })
        }

        commandEncoder.queueDispose(stagingTexture);
        commandEncoder.submit();
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._state == State.DISPOSING || this._state == State.DISPOSED) {
            return;
        }
        this._disposeTextureViews();
        WebGpuUtilities.texture.dispose(this._gpuTexture);
        this._gpuTexture = null;
        this._state = State.DISPOSED;

        for (const listener of this._disposedListeners.slice()) {
            listener(this);
        }
    }
}
