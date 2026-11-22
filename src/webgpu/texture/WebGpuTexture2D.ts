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
import { ValidationUtilities } from "../../api/validation/ValidationUtilities.ts";

/**
 * The WebGPU 2D texture.
 *
 * Supports `Uint8Array` mip levels (uncompressed or compressed, e.g. from KTX2).
 * `generateMipmaps` is implemented with a compute shader for `RGBA8_UNORM` and `RGBA8_UNORM_SRGB`.
 * Other formats throw. sRGB textures are written
 * through an `rgba8unorm` view (`rgba8unorm-srgb` cannot be a storage texture); the shader filters in linear space.
 * @internal
 */
export class WebGpuTexture2D extends ATexture2D {

    private readonly _framework: IFramework;
    declare protected readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _gpuTexture: GPUTexture | null = null;

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
     * or the usage lacks `COPY_DST` while there is data to upload.
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

        this._nativeObject = this._gpuTexture;

        if (this._generateMipmaps) {
            this._framework.dispatcher.addNextUpdateFrameAction(() => this._fillMipmapsAsync());
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

    /** Generates the mip chain from mip level 0. */
    private async _fillMipmapsAsync(): Promise<void> {

        const pipeline = await this._framework.computePipelineFactory!.createDownsampleTexturePipelineAsync();

        // The texture (or a pipeline) may have been disposed while pipelines were being created.
        if (this._state != State.INITIALIZED || pipeline.state != State.INITIALIZED) {
            console.warn("Canceling creation of texture mipmaps. The texture or a downsample pipeline is not initialized.");
            pipeline.dispose();
            return;
        }

        // We need encoder to encode commands that needs to be done.
        const prepEncoder = this._graphicsDevice.createCommandEncoder("Prepare encoder");
        prepEncoder.start();

        // Create staging texture optionally.
        let stagingTexture = this._framework.textureFactory.create({
            commandEncoder: prepEncoder,
            width: this.size[0],
            height: this.size[1],
            label: "StagingTexture",
            textureFormat: TextureFormat.RGBA8_UNORM,
            textureUsage: TextureUsage.STORAGE_BINDING | TextureUsage.COPY_SRC,
            mipmapLevels: this.mipLevels
        }) as WebGpuTexture2D;

        const workgroupSize = 8;

        prepEncoder.submit();
        prepEncoder.dispose();
        // This created pipeline and staging texture.

        for (let mipLevel = 0; mipLevel < this.mipLevels - 1; mipLevel++) {

            const nextMipLevel = mipLevel + 1;
            const encoder = this._graphicsDevice.createCommandEncoder(`Create mip level encoder: ${nextMipLevel}`);

            const computePass = this._framework.computeContext!.createComputePass({
                commandEncoder: encoder,
                label: "Downsample Pass"
            });

            // Begin compute pass.
            encoder.start();
            computePass.beginPass();

            const source = this._createTextureView({
                viewFormat: this.textureFormat,
                baseMipLevel: mipLevel,
                mipLevelCount: 1,
            });

            const destination = stagingTexture.createView({
                viewFormat: TextureFormat.RGBA8_UNORM,
                baseMipLevel: nextMipLevel,
                mipLevelCount: 1,
            });

            pipeline.source = source;
            pipeline.target = destination;

            pipeline.dispatchWorkgroup(
                Math.ceil(destination.size[0] / workgroupSize),
                Math.ceil(destination.size[1] / workgroupSize),
                1);

            computePass.endPass();
            encoder.copyTextureToTexture(
                { texture: stagingTexture, mipLevel: nextMipLevel },
                { texture: this, mipLevel: nextMipLevel });
            encoder.submit();

            // Dispose
            encoder.dispose();
            computePass.dispose();
            source.dispose();
            destination.dispose();
        }

        pipeline.dispose();
        stagingTexture.dispose();
    }

    /**
     * Destroys the GPU texture.
     * @inheritDoc
     * @ai-generated
     */
    protected _dispose(): void {
        WebGpuUtilities.texture.dispose(this._gpuTexture);
        this._gpuTexture = null;
    }
}
