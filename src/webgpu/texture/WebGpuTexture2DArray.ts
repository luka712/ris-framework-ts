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
import { ATexture2DArray } from "../../api/gpu/texture/ATexture2DArray.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuTextureView } from "./WebGpuTextureView.ts";
import { WebGpuUtilities } from "../utilities/WebGpuUtilities.ts";
import type { WebGpuTexture2D } from "./WebGpuTexture2D.ts";

/**
 * The WebGPU 2D texture array: a `GPUTexture` with `dimension: "2d"` and `depthOrArrayLayers` set to the layer count,
 * sampled in WGSL as `texture_2d_array<f32>` through a `2d-array` view.
 *
 * Every layer and mip level of {@link ITextureDescriptor.dataArray} is uploaded with `GPUQueue.writeTexture`
 * (`origin.z` is the layer). Supports `Uint8Array` mip levels (uncompressed, or block-compressed e.g. from KTX2)
 * and `HTMLImageElement` mip levels (uncompressed only; needs `COPY_DST` and `RENDER_ATTACHMENT` usage).
 * `generateMipmaps` is implemented with a compute shader for `RGBA8_UNORM` and `RGBA8_UNORM_SRGB`.
 * Other formats throw. sRGB textures are written
 * through an `rgba8unorm` view (`rgba8unorm-srgb` cannot be a storage texture); the shader filters in linear space.
 * @internal
 */
export class WebGpuTexture2DArray extends ATexture2DArray {

    private readonly _framework: IFramework;
    declare protected readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _gpuTexture: GPUTexture | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The texture descriptor. `layers` (or `dataArray.length`) is the layer count.
     * By default, usage is `TEXTURE_BINDING | COPY_DST` and the label is `WebGpuTexture2DArray <id>`.
     */
    public constructor(framework: IFramework, descriptor: ITextureDescriptor) {
        const graphicsDevice = framework.graphicsDevice as WebGpuGraphicsDevice;
        super(graphicsDevice, descriptor);
        this._framework = framework;

        if (!this._label) {
            this._label = `WebGpuTexture2DArray ${this.id}`;
        }
    }

    /** The WebGPU texture. Throws when the texture is not initialized or is disposed. */
    public get gpuTexture(): GPUTexture {
        if (!this._gpuTexture) {
            throw new Error(`WebGpuTexture2DArray.gpuTexture: '${this.label ?? this.id}' is not initialized or is disposed.`);
        }
        return this._gpuTexture;
    }

    /**
     * The default WebGPU `2d-array` view of every layer and mip level, in the texture's own format.
     * Same as `defaultTextureView.nativeObject`. Throws when the texture is not initialized or is disposed.
     */
    public get gpuDefaultView(): GPUTextureView {
        if (!this._gpuTexture) {
            throw new Error(`WebGpuTexture2DArray.gpuDefaultView: '${this.label ?? this.id}' is not initialized or is disposed.`);
        }
        return (this.defaultTextureView as WebGpuTextureView).gpuTextureView;
    }

    /**
     * Creates the GPU texture and uploads every layer and mip level.
     * @throws Error when the texture is already initialized or disposed,
     * mipmap generation is requested when compute is not supported or for an unsupported format,
     * mipmap generation is requested and the usage lacks `STORAGE_BINDING`,
     * the usage lacks `COPY_DST` (or `RENDER_ATTACHMENT` for images) while there is data to upload,
     * or a compressed format is given images.
     */
    public initialize(): void {
        this._validateState();

        const name = this.label ?? this.id;
        const data = this._data;

        let mipLevelCount = this._mipLevels;
        if (this._generateMipMaps) {
            if (this.textureFormat != TextureFormat.RGBA8_UNORM && this.textureFormat != TextureFormat.RGBA8_UNORM_SRGB) {
                throw new Error(
                    `WebGpuTexture2DArray.initialize: '${name}' has format ${this.textureFormat}; ` +
                    `mipmaps can only be generated for RGBA8_UNORM and RGBA8_UNORM_SRGB.`);
            }
            mipLevelCount = TextureUtilities.mipLevels(this.size[0], this.size[1]);
            if (this.textureFormat == TextureFormat.RGBA8_UNORM_SRGB && !this.viewFormats.includes(TextureFormat.RGBA8_UNORM)) {
                this.viewFormats.push(TextureFormat.RGBA8_UNORM);
            }
        }

        const result = TextureUtilities.isCompressedTextureFormat(this.textureFormat)
            ? WebGpuUtilities.texture.create2DArrayCompressed(
                this._graphicsDevice.device,
                this._baseSize,
                this.size[2],
                this._blockSize,
                this.textureFormat,
                this.textureUsage,
                data as Uint8Array[][] | undefined,
                this.label,
                this.viewFormats)
            : WebGpuUtilities.texture.create2DArray(
                this._graphicsDevice.device,
                this._baseSize,
                this.size[2],
                this.textureFormat,
                this.textureUsage,
                data,
                this.label,
                this.viewFormats,
                mipLevelCount);

        this._gpuTexture = result.texture;
        this._handle = this._gpuTexture;

        if (this._generateMipMaps) {
            this._mipLevels = mipLevelCount;
            this._framework.dispatcher.addNextUpdateFrameAction(() => this._fillMipmapsAsync());
        }

        this._state = State.INITIALIZED;

        let width = this.size[0];
        let height = this.size[1];
        const layers = this.size[2];
        this._vramSize = 0;
        for (let i = 0; i < this.mipLevels; i++) {
            this._vramSize += TextureUtilities.getVRamSize(this.textureFormat, width, height) * layers;
            width = Math.max(1, Math.floor(width / 2));
            height = Math.max(1, Math.floor(height / 2));
        }
    }

    /**
     * Creates a native `2d-array` view of every layer and mip level with `GPUTexture.createView`.
     * The format is legal because the texture was created with `GPUTextureDescriptor.viewFormats` set to {@link viewFormats}.
     * @inheritDoc
     */
    protected _createTextureView(descriptor: ITextureViewDescriptor): ITextureView2D {
        return new WebGpuTextureView(this._framework, this, descriptor);
    }

    /**
     * Generates the mip chain of every layer from mip level 0, chaining each mip level from the previous one.
     * Each step downsamples into a 2D staging texture, which is then copied into that layer and mip level.
     * @ai-generated
     */
    private async _fillMipmapsAsync(): Promise<void> {

        const pipeline = await this._framework.computePipelineFactory!.createDownsampleTexturePipelineAsync();

        // The texture (or the pipeline) may have been disposed while the pipeline was being created.
        if (this._state != State.INITIALIZED || pipeline.state != State.INITIALIZED) {
            console.warn("Canceling creation of texture mipmaps. The texture or a downsample pipeline is not initialized.");
            pipeline.dispose();
            return;
        }

        const prepEncoder = this._graphicsDevice.createCommandEncoder("Prepare encoder");
        prepEncoder.start();

        const stagingTexture = this._framework.textureFactory.create({
            commandEncoder: prepEncoder,
            width: this.size[0],
            height: this.size[1],
            label: "StagingTexture",
            textureFormat: TextureFormat.RGBA8_UNORM,
            textureUsage: TextureUsage.STORAGE_BINDING | TextureUsage.COPY_SRC,
            mipmapLevels: this.mipLevels
        }) as WebGpuTexture2D;

        prepEncoder.submit();
        prepEncoder.dispose();

        const workgroupSize = 8;
        const layers = this.size[2];

        for (let layer = 0; layer < layers; layer++) {
            for (let mipLevel = 0; mipLevel < this.mipLevels - 1; mipLevel++) {

                const nextMipLevel = mipLevel + 1;
                const encoder = this._graphicsDevice.createCommandEncoder(`Create mip level encoder: layer ${layer}, mip ${nextMipLevel}`);

                const computePass = this._framework.computeContext!.createComputePass({
                    commandEncoder: encoder,
                    label: "Downsample Pass"
                });

                encoder.start();
                computePass.beginPass();

                const source = this._createTextureView({
                    viewFormat: this.textureFormat,
                    dimension: TextureViewDimension.DIMENSION_2D,
                    baseMipLevel: mipLevel,
                    mipLevelCount: 1,
                    baseArrayLayer: layer,
                    arrayLayerCount: 1,
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
                    { texture: this, mipLevel: nextMipLevel, arrayLayer: layer });
                encoder.submit();

                encoder.dispose();
                computePass.dispose();
                source.dispose();
                destination.dispose();
            }
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
