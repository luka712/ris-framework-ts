import {vec2} from "gl-matrix";
import {
    BufferUsage,
    GeometryFormat,
    type IFramework,
    type IMainRenderTargetRenderPipeline,
    type ITexture2D,
    OutputColorSpace,
    TextureFormat,
} from "../../api/index.ts";
import {VertexBufferLayout} from "../../core/rendering/vertex-buffer-layout.ts";
import {AWebGpuRenderPipeline} from "./AWebGpuRenderPipeline.ts";
import type {WebGpuTexture2D} from "../texture/WebGpuTexture2D.ts";
import type {WebGpuVertexBuffer} from "../buffers/WebGpuVertexBuffer.ts";
import type {WebGpuIndexBuffer} from "../buffers/WebGpuIndexBuffer.ts";
import type {WebGpuShaderModule} from "../shader/WebGpuShaderModule.ts";
import type {WebGpuUniformBuffer} from "../buffers/WebGpuUniformBuffer.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * Draws the main render target to the swap chain with `main_frame_buffer.wgsl`.
 * The main render target stays linear ({@link TextureFormat.RGBA8_UNORM}); encoding to sRGB is done in the shader
 * when {@link outputColorSpace} is SRGB (same approach as WebGL).
 * @internal
 */
export class WebGpuMainRenderTargetRenderPipeline extends AWebGpuRenderPipeline implements IMainRenderTargetRenderPipeline {

    private _vertexBuffer: WebGpuVertexBuffer = null!;
    private _indexBuffer: WebGpuIndexBuffer = null!;
    private _mainRenderTarget: WebGpuTexture2D;
    private _bindGroupLayout: GPUBindGroupLayout = null!;
    private _bindGroup: GPUBindGroup | null = null;

    private static readonly FRAGMENT_DATA_SIZE = 4;

    /**
     * The `FragmentData` uniform (16 bytes / std140), offsets in floats:
     * [0] flipY, [1] colorConversion, [2] gamma, [3] padding.
     */
    private readonly _fragmentData = new Float32Array(WebGpuMainRenderTargetRenderPipeline.FRAGMENT_DATA_SIZE);
    private _fragmentDataBuffer: WebGpuUniformBuffer | null = null;
    private _outputColorSpace: OutputColorSpace = OutputColorSpace.NONE;

    /**
     * The constructor.
     * @param framework The framework.
     * @param mainRenderTarget The main render target.
     */
    public constructor(framework: IFramework, mainRenderTarget: ITexture2D) {
        super(framework);
        this._mainRenderTarget = mainRenderTarget as WebGpuTexture2D;
        // WebGPU texture and framebuffer origin is top-left; no flip by default.
        this._fragmentData[0] = 0;
        this._fragmentData[2] = 2.2;
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_TEXTURECOORDS2;

    /** @inheritDoc */
    public get mainRenderTarget(): ITexture2D {
        return this._mainRenderTarget;
    }

    /** Sets the main render target and rebuilds the bind group. */
    public set mainRenderTarget(value: ITexture2D) {
        this._mainRenderTarget = value as WebGpuTexture2D;
        this._bindGroup = null;
    }

    /**
     * Whether the main render target is flipped vertically. By default, false (WebGPU origin is top-left).
     */
    public get flipY(): boolean {
        return this._fragmentData[0] == 1;
    }

    public set flipY(value: boolean) {
        this._fragmentData[0] = value ? 1 : 0;
        this._fragmentDataBuffer?.update(this._fragmentData, 0, 1);
    }

    /**
     * The output color space. When SRGB, the blit shader encodes with {@link gamma}.
     * By default, {@link OutputColorSpace.NONE}.
     */
    public get outputColorSpace(): OutputColorSpace {
        return this._outputColorSpace;
    }

    public set outputColorSpace(value: OutputColorSpace) {
        this._outputColorSpace = value;
        this._fragmentData[1] = value == OutputColorSpace.SRGB ? 1 : 0;
        this._fragmentDataBuffer?.update(this._fragmentData, 1, 1);
    }

    /**
     * The gamma used when {@link outputColorSpace} is SRGB. By default, 2.2.
     */
    public get gamma(): number {
        return this._fragmentData[2];
    }

    public set gamma(value: number) {
        this._fragmentData[2] = value;
        this._fragmentDataBuffer?.update(this._fragmentData, 2, 1);
    }

    /** @inheritDoc */
    public initialize(): void {
        const module = this._framework.content.loadShaderModule("main_frame_buffer") as WebGpuShaderModule;

        const geometry = this._framework.geometryBuilder.quadGeometry(vec2.fromValues(2, 2));
        const data = geometry.toInterleaved(GeometryFormat.POS3_TEXTURECOORDS2);
        this._vertexBuffer = this._framework.bufferFactory.createVertexBuffer(
            data, (3 + 2) * Float32Array.BYTES_PER_ELEMENT, BufferUsage.VERTEX,
            "Main Frame Buffer Render Pipeline Vertex Buffer") as WebGpuVertexBuffer;
        this._indexBuffer = this._framework.bufferFactory.createIndexBuffer(
            geometry.indices!, "Main Frame Buffer Render Pipeline Index Buffer") as WebGpuIndexBuffer;

        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float2Layout()];

        this._fragmentDataBuffer = this._framework.bufferFactory.createUniformBuffer(
            this._fragmentData,
            BufferUsage.UNIFORM | BufferUsage.COPY_DST,
            "Main Frame Buffer Fragment Data Buffer") as WebGpuUniformBuffer;

        this._bindGroupLayout = WebGpuUtilities.bindGroupLayout.create(this._graphicsDevice.device, [
            WebGpuUtilities.bindGroupLayoutEntry.createTextureBindGroupLayoutEntry(0, GPUShaderStage.FRAGMENT),
            WebGpuUtilities.bindGroupLayoutEntry.createSamplerBindGroupLayoutEntry(1, GPUShaderStage.FRAGMENT),
            WebGpuUtilities.bindGroupLayoutEntry.createUniformBufferBindGroupLayoutEntry(2, GPUShaderStage.FRAGMENT),
        ], "Main Frame Buffer bind group layout");

        // Drawn in the swap chain pass, which has no depth attachment. Target the swap chain format (always linear UNORM).
        this._createGpuPipeline(
            "Main Frame Buffer Render Pipeline",
            module.gpuShaderModule,
            [this._bindGroupLayout],
            this._graphicsDevice.swapChain?.textureFormat ?? TextureFormat.RGBA8_UNORM);
    }

    private _getBindGroup(): GPUBindGroup {
        if (!this._bindGroup) {
            this._bindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._bindGroupLayout, [
                {binding: 0, resource: this._mainRenderTarget.gpuDefaultView},
                {binding: 1, resource: this._defaultTextureSampler.gpuSampler},
                {
                    binding: 2,
                    resource: {
                        buffer: this._fragmentDataBuffer!.gpuBuffer,
                        offset: 0,
                        size: this._fragmentData.byteLength,
                    },
                },
            ], "Main Frame Buffer bind group");
        }
        return this._bindGroup;
    }

    /** @inheritDoc */
    public render(): void {
        if (!this._gpuPipeline) {
            return;
        }
        const encoder = this._graphicsDevice.renderPassEncoder;
        encoder.setPipeline(this._gpuPipeline);
        encoder.setVertexBuffer(0, this._vertexBuffer.gpuBuffer, 0, this._vertexBuffer.byteSize);
        encoder.setIndexBuffer(this._indexBuffer.gpuBuffer, this._indexBuffer.gpuIndexFormat, 0, this._indexBuffer.paddedByteSize);
        encoder.setBindGroup(0, this._getBindGroup());
        encoder.drawIndexed(this._indexBuffer.indicesCount, 1, 0);
    }

    /** @inheritDoc */
    public override dispose(): void {
        // ARenderer recreates this pipeline on every resize, so release the quad buffers too.
        this._vertexBuffer?.dispose();
        this._indexBuffer?.dispose();
        this._fragmentDataBuffer?.dispose();
        this._fragmentDataBuffer = null;
        this._bindGroup = null;
        super.dispose();
    }
}
