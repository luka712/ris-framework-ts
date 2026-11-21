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
import { WebGpuDownsampleTextureComputePipeline } from "../compute/pipelines/WebGpuDownsampleTextureComputePipeline.ts";
import type { WebGpuCommandEncoder } from "../WebGpuCommandEncoder.ts";
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
     * Generates the mip chain of every layer from mip level 0.
     * Each layer is downsampled into a 2D staging texture, which is then copied into that layer.
     * @ai-generated
     */
    private async _fillMipmapsAsync(): Promise<void> {

        const layers = this.size[2];

        const pipelinesTasks = [];
        for (let i = 0; i < this.mipLevels * layers; i++) {
            const pipelineTask = this._framework.computePipelineFactory!.createDownsampleTexturePipelineAsync();
            pipelinesTasks.push(pipelineTask);
        }

        const pipelines = (await Promise.all(pipelinesTasks)).map(x => x as WebGpuDownsampleTextureComputePipeline);

        // The texture (or a pipeline) may have been disposed while pipelines were being created.
        if (this._state != State.INITIALIZED || pipelines.some(p => p.state != State.INITIALIZED))
        {
            console.warn("Canceling creation of texture mipmaps. The texture or a downsample pipeline is not initialized.");
            pipelines.forEach(x => x.dispose());
            return;
        }

        // We need encoder to encode commands that needs to be done.
        const encoder = this._graphicsDevice.createCommandEncoder("FillMipmaps Encoder");
        encoder.start();
        const downsampleComputePass = this._framework.computeContext!.createComputePass({
            commandEncoder: encoder,
            label: "Downsample Pass"
        });

        // One staging texture per layer.
        const stagingTextures: WebGpuTexture2D[] = [];
        for (let layer = 0; layer < layers; layer++) {
            stagingTextures.push(this._framework.textureFactory.create({
                commandEncoder: encoder,
                width: this.size[0],
                height: this.size[1],
                label: `StagingTexture ${layer}`,
                textureFormat: TextureFormat.RGBA8_UNORM,
                textureUsage: TextureUsage.STORAGE_BINDING | TextureUsage.COPY_SRC,
                mipmapLevels: this.mipLevels
            }) as WebGpuTexture2D);
        }

        const workgroupSize = 8;

        // Begin compute pass.
        downsampleComputePass.beginPass();

        for (let layer = 0; layer < layers; layer++) {

            const source = this._createTextureView({
                viewFormat: this.textureFormat,
                dimension: TextureViewDimension.DIMENSION_2D,
                baseMipLevel: 0,
                mipLevelCount: 1,
                baseArrayLayer: layer,
                arrayLayerCount: 1,
            });

            for (let i = 0; i < this.mipLevels; i++) {

                const desc: ITextureViewDescriptor = {
                    viewFormat: TextureFormat.RGBA8_UNORM,
                    mipLevelCount: 1,
                    baseMipLevel: i,
                };

                const pipeline = pipelines[layer * this.mipLevels + i];
                pipeline.source = source;
                const destination = stagingTextures[layer].createView(desc);
                pipeline.target = destination;
                encoder.queueDispose(pipeline);

                pipeline.dispatchWorkgroup(
                    Math.ceil(destination.size[0] / workgroupSize),
                    Math.ceil(destination.size[1] / workgroupSize),
                    1);
            }
        }

        // End pass. It can be disposed when ended.
        downsampleComputePass.endPass();
        downsampleComputePass.dispose();

        // Submit everything to queue.
        encoder.submit();
        encoder.dispose();

        const commandEncoder = this._graphicsDevice.createCommandEncoder("GenerateMipmapsCopyBack") as WebGpuCommandEncoder;
        commandEncoder.start();

        for (let layer = 0; layer < layers; layer++) {
            for (let i = 1; i < this.mipLevels; i++) {

                const width = Math.max(1, this.size[0] >> i);
                const height = Math.max(1, this.size[1] >> i);

                commandEncoder.gpuCommandEncoder!.copyTextureToTexture(
                    { texture: stagingTextures[layer].gpuTexture, mipLevel: i },
                    { texture: this.gpuTexture, mipLevel: i, origin: { x: 0, y: 0, z: layer } },
                    {
                        width,
                        height,
                        depthOrArrayLayers: 1
                    });
            }
            commandEncoder.queueDispose(stagingTextures[layer]);
        }

        commandEncoder.submit();
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
