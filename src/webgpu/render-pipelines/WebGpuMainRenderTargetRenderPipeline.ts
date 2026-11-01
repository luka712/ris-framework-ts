import {vec2} from "gl-matrix";
import {
    BufferUsage,
    GeometryFormat,
    type IFramework,
    type IMainRenderTargetRenderPipeline,
    type ITexture2D,
} from "../../api/index.ts";
import {VertexBufferLayout} from "../../core/rendering/vertex-buffer-layout.ts";
import {AWebGpuRenderPipeline} from "./AWebGpuRenderPipeline.ts";
import type {WebGpuTexture2D} from "../texture/WebGpuTexture2D.ts";
import type {WebGpuVertexBuffer} from "../buffers/WebGpuVertexBuffer.ts";
import type {WebGpuIndexBuffer} from "../buffers/WebGpuIndexBuffer.ts";
import type {WebGpuShaderModule} from "../shader/WebGpuShaderModule.ts";
import {GpuShaderStage, type GpuBindGroup, type GpuBindGroupLayout} from "../WebGpuTypes.ts";

/**
 * Draws the main render target to the swap chain with `main_frame_buffer.wgsl`.
 * No Y flip: in WebGPU texture (0,0) is the top-left, which matches the quad's UVs (same as the C# backend).
 * @internal
 */
export class WebGpuMainRenderTargetRenderPipeline extends AWebGpuRenderPipeline implements IMainRenderTargetRenderPipeline {

    private _vertexBuffer: WebGpuVertexBuffer = null!;
    private _indexBuffer: WebGpuIndexBuffer = null!;
    private _mainRenderTarget: WebGpuTexture2D;
    private _bindGroupLayout: GpuBindGroupLayout = null!;
    private _bindGroup: GpuBindGroup | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param mainRenderTarget The main render target.
     */
    public constructor(framework: IFramework, mainRenderTarget: ITexture2D) {
        super(framework);
        this._mainRenderTarget = mainRenderTarget as WebGpuTexture2D;
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

        this._bindGroupLayout = this._graphicsDevice.device.createBindGroupLayout({
            label: "Main Frame Buffer bind group layout",
            entries: [
                {binding: 0, visibility: GpuShaderStage.FRAGMENT, texture: {sampleType: "float"}},
                {binding: 1, visibility: GpuShaderStage.FRAGMENT, sampler: {type: "filtering"}},
            ],
        });

        // Drawn in the swap chain pass, which has no depth attachment.
        this._createGpuPipeline(
            "Main Frame Buffer Render Pipeline",
            module.gpuShaderModule,
            [this._bindGroupLayout],
            this._graphicsDevice.swapChain?.textureFormat ?? this._framework.renderer.preferredTextureFormat);
    }

    private _getBindGroup(): GpuBindGroup {
        if (!this._bindGroup) {
            this._bindGroup = this._graphicsDevice.device.createBindGroup({
                label: "Main Frame Buffer bind group",
                layout: this._bindGroupLayout,
                entries: [
                    {binding: 0, resource: this._mainRenderTarget.gpuDefaultView},
                    {binding: 1, resource: this._defaultTextureSampler.gpuSampler},
                ],
            });
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
        this._bindGroup = null;
        super.dispose();
    }
}
