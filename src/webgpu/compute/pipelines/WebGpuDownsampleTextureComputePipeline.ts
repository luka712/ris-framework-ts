import { TextureFormat } from "../../../api/gpu/texture/TextureFormat.ts";
import type { ITextureView2D } from "../../../api/gpu/texture/view/ITextureView2D.ts";
import type { IDownsampleTextureComputePipeline } from "../../../api/gpu/compute/pipelines/IDownsampleTextureComputePipeline.ts";
import type { IFramework } from "../../../api/IFramework.ts";
import { BufferUsage } from "../../../api/gpu/buffers/BufferUsage.ts";
import type { IUniformBuffer } from "../../../api/gpu/buffers/IUniformBuffer.ts";
import type { WebGpuShaderModule } from "../../shader/WebGpuShaderModule.ts";
import { WebGpuUniformBuffer } from "../../buffers/WebGpuUniformBuffer.ts";
import { WebGpuUtilities } from "../../utilities/WebGpuUtilities.ts";
import { AWebGpuComputePipeline } from "./AWebGpuComputePipeline.ts";
import type { vec3 } from "gl-matrix";

/**
 * WebGPU compute pipeline that downsamples a texture view into another.
 * For sRGB sources and targets, the texture must include `rgba8unorm` in `viewFormats`.
 * @internal
 */
export class WebGpuDownsampleTextureComputePipeline extends AWebGpuComputePipeline implements IDownsampleTextureComputePipeline {

    private _source: ITextureView2D | null = null;
    private _target: ITextureView2D | null = null;
    private _dispatched = false;
    private _bindGroupLayout!: GPUBindGroupLayout;

    /**
     * Uniform buffer where layout is:
     * - vec2 sourceSize
     * - vec2 destSize
     * - float srgb
     * - vec3 padding
     */
    private _uniformBuffer!: IUniformBuffer;
    private _srgb = false;

    /**
     * The constructor.
     * @param framework The framework. Dispatch uses its compute context for the device and the current pass encoder.
     */
    public constructor(framework: IFramework) {
        super(framework);
    }

    /** @inheritDoc */
    public get source(): ITextureView2D {
        return this._source!;
    }

    public set source(value: ITextureView2D) {
        if (value.viewFormat != TextureFormat.RGBA8_UNORM && value.viewFormat != TextureFormat.RGBA8_UNORM_SRGB) {
            throw new Error(`WebGpuDownsampleTextureComputePipeline.source: format ${value.viewFormat} is not supported.`);
        }

        if (this._source != value) {
            this._source = value;
            this._uniformBuffer.writeSingle(this.source.size[0], 0);
            this._uniformBuffer.writeSingle(this.source.size[1], 1);
        }
        const srgb = value.viewFormat == TextureFormat.RGBA8_UNORM_SRGB;
        if (srgb != this._srgb) {
            this._srgb = srgb;
            this._uniformBuffer.writeSingle(srgb ? 1 : 0, 4);
        }
    }

    /** @inheritDoc */
    public get target(): ITextureView2D {
        return this._target!;
    }

    public set target(value: ITextureView2D) {
        if (value.viewFormat != TextureFormat.RGBA8_UNORM && value.viewFormat != TextureFormat.RGBA8_UNORM_SRGB) {
            throw new Error(`WebGpuDownsampleTextureComputePipeline.target: format ${value.viewFormat} is not supported.`);
        }
        if (this._target != value) {
            this._uniformBuffer.writeSingle(value.size[0], 2);
            this._uniformBuffer.writeSingle(value.size[1], 3);
            this._target = value;
        }
    }


    /** @inheritDoc */
    public initialize(): void {
        this._uniformBuffer = this._framework.bufferFactory.createUniformBuffer(
            new Float32Array(8),
            BufferUsage.UNIFORM | BufferUsage.COPY_DST,
            "DownsampleParams");

        const device = this._graphicsDevice.device;
        const entries = WebGpuUtilities.bindGroupLayoutEntry;
        this._bindGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createTextureBindGroupLayoutEntry(0, GPUShaderStage.COMPUTE),
            entries.createTextureStorageBindGroupLayoutEntry(1, GPUShaderStage.COMPUTE, "rgba8unorm"),
            entries.createUniformBufferBindGroupLayoutEntry(2, GPUShaderStage.COMPUTE),
        ], "downsample_texture group 0 layout");
        const shaderModule = this._framework.content.loadShaderModule("downsample_texture") as WebGpuShaderModule;
        this._createGpuPipeline("downsample_texture", shaderModule.compute!, [this._bindGroupLayout]);
    }

    /** @inheritDoc */
    public dispatch(workgroups: vec3): void {
        this.dispatchWorkgroup(workgroups[0], workgroups[1], workgroups[2]);
    }

    /** @inheritDoc */
    public dispatchWorkgroup(x: number, y: number, z: number = 1): void {
        if (this._dispatched) {
            return;
        }
        this._dispatched = true;

        const source = this._source!;
        const target = this._target!;
        
        this._uniformBuffer.update();

        const bindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._bindGroupLayout, [
            { binding: 0, resource: source.nativeObject as GPUTextureView },
            { binding: 1, resource: target.nativeObject as GPUTextureView },
            { binding: 2, resource: { buffer: (this._uniformBuffer as WebGpuUniformBuffer).gpuBuffer } },
        ]);

        const encoder = this._graphicsDevice.computePassEncoder;
        encoder.setPipeline(this._gpuPipeline!);
        encoder.setBindGroup(0, bindGroup);
        encoder.dispatchWorkgroups(x, y, z);
    }

    /** @inheritDoc */
    public frameEnd(): void {
        this._dispatched = false;
    }

    /** @inheritDoc */
    public dispose(): void {
        this._uniformBuffer.dispose();
        super.dispose();
    }
}
