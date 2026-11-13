import {
    GeometryFormat,
    type IFramework,
    type IIndexBuffer,
    type IInspectTextureMipsRenderPipeline,
    type IPrimitiveState,
    type ISampler,
    type ITexture2D,
    type IUniformBuffer,
    type IVertexBuffer,
    State,
    TextureFormat,
} from "../../../api/index.ts";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout.ts";
import {AWebGpuRenderPipeline} from "../AWebGpuRenderPipeline.ts";
import {WebGpuTexture2D} from "../../texture/WebGpuTexture2D.ts";
import type {WebGpuSampler} from "../../sampler/WebGpuSampler.ts";
import type {WebGpuUniformBuffer} from "../../buffers/WebGpuUniformBuffer.ts";
import type {WebGpuVertexBuffer} from "../../buffers/WebGpuVertexBuffer.ts";
import type {WebGpuIndexBuffer} from "../../buffers/WebGpuIndexBuffer.ts";
import type {WebGpuShaderModule} from "../../shader/WebGpuShaderModule.ts";
import {WebGpuUtilities} from "../../utilities/WebGpuUtilities.ts";
import { WebGpuTextureFactory } from "../../texture/WebGpuTextureFactory.ts";

/**
 * The WebGPU implementation of {@link IInspectTextureMipsRenderPipeline}, mirroring the WebGL one.
 * Uses the `inspect_texture_mips` WGSL shader (`texture_2d<f32>` sampled with `textureSampleLevel` at the fragment data's mip level).
 *
 * Group 0: projection-view (0), model (1), vertex. Group 1: texture (0), sampler (1), fragment.
 * Group 2: fragment data (2), fragment.
 * A 1x1 white texture is used when no texture is set.
 * @internal
 */
export class WebGpuInspectTextureMipsRenderPipeline extends AWebGpuRenderPipeline implements IInspectTextureMipsRenderPipeline {

    private static readonly SHADER_ID = "inspect_texture_mips";

    private _texture: WebGpuTexture2D | null = null;
    private _sampler?: WebGpuSampler;
    private _projectionViewBuffer: IUniformBuffer;
    private _modelBuffer: IUniformBuffer;
    private _fragmentDataBuffer: IUniformBuffer;

    private _cameraGroupLayout: GPUBindGroupLayout = null!;
    private _textureGroupLayout: GPUBindGroupLayout = null!;
    private _fragmentGroupLayout: GPUBindGroupLayout = null!;

    /** Rebuilt when the projection-view or model buffer changes. */
    private _cameraBindGroup: GPUBindGroup | null = null;
    private _cameraBindGroupBuffers: GPUBuffer[] = [];
    /** Rebuilt when the fragment data buffer changes. */
    private _fragmentBindGroup: GPUBindGroup | null = null;
    private _fragmentBindGroupBuffer: GPUBuffer | null = null;

    /** Texture bind groups, keyed by `textureId:samplerId`. Forgotten when the texture is disposed. */
    private readonly _textureBindGroups = new Map<string, GPUBindGroup>();
    private readonly _watchedTextures = new Set<ITexture2D>();
    private readonly _onTextureDisposed = (texture: ITexture2D) => this._forgetTexture(texture);

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection view buffer (one `mat4`).
     * @param modelBuffer The model buffer (one `mat4`). Required.
     * @param fragmentDataBuffer The fragment data buffer. See {@link fragmentDataBuffer}.
     * @param primitiveState The primitive state. By default, the graphics device's default primitive state.
     * @throws Error when `modelBuffer` is missing.
     */
    public constructor(framework: IFramework,
                       projectionViewBuffer: IUniformBuffer,
                       modelBuffer: IUniformBuffer,
                       fragmentDataBuffer: IUniformBuffer,
                       primitiveState?: IPrimitiveState) {
        if (!modelBuffer) {
            throw new Error("WebGpuInspectTextureMipsRenderPipeline: modelBuffer is required (the mesh's model buffer, mat4).");
        }
        super(framework, primitiveState);
        this._projectionViewBuffer = projectionViewBuffer;
        this._modelBuffer = modelBuffer;
        this._fragmentDataBuffer = fragmentDataBuffer;
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float4Float2Layout()];
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2;

    /** @inheritDoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._projectionViewBuffer;
    }

    /** @inheritDoc */
    public set projectionViewBuffer(value: IUniformBuffer) {
        this._projectionViewBuffer = value;
    }

    /** @inheritDoc */
    public get modelBuffer(): IUniformBuffer {
        return this._modelBuffer;
    }

    /** @inheritDoc */
    public set modelBuffer(value: IUniformBuffer) {
        if (!value) {
            throw new Error("WebGpuInspectTextureMipsRenderPipeline: modelBuffer is required (the mesh's model buffer, mat4).");
        }
        this._modelBuffer = value;
    }

    /** @inheritDoc */
    public get fragmentDataBuffer(): IUniformBuffer {
        return this._fragmentDataBuffer;
    }

    /** @inheritDoc */
    public set fragmentDataBuffer(value: IUniformBuffer) {
        this._fragmentDataBuffer = value;
    }

    /** @inheritDoc */
    public get texture(): ITexture2D {
        return this._texture ?? (this._framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2D();
    }

    /** @inheritDoc */
    public set texture(value: ITexture2D) {
        this._texture = (value as WebGpuTexture2D) ?? null;
    }

    /** @inheritDoc */
    public get textureSampler(): ISampler | undefined {
        return this._sampler;
    }

    /** @inheritDoc */
    public set textureSampler(value: ISampler | undefined) {
        this._sampler = value as WebGpuSampler | undefined;
    }

    /** Loads the `inspect_texture_mips` WGSL module, creates the bind group layouts and the render pipeline. */
    public initialize(): void {
        const device = this._graphicsDevice.device;
        const shaderId = WebGpuInspectTextureMipsRenderPipeline.SHADER_ID;
        const module = this._framework.content.loadShaderModule(shaderId) as WebGpuShaderModule;
        const entries = WebGpuUtilities.bindGroupLayoutEntry;

        this._cameraGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createUniformBufferBindGroupLayoutEntry(0, GPUShaderStage.VERTEX),
            entries.createUniformBufferBindGroupLayoutEntry(1, GPUShaderStage.VERTEX),
        ], `${shaderId} group 0 layout`);

        this._textureGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createTextureBindGroupLayoutEntry(0, GPUShaderStage.FRAGMENT, "float", "2d"),
            entries.createSamplerBindGroupLayoutEntry(1, GPUShaderStage.FRAGMENT),
        ], `${shaderId} texture group layout`);

        this._fragmentGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createUniformBufferBindGroupLayoutEntry(2, GPUShaderStage.FRAGMENT),
        ], `${shaderId} group 2 layout`);

        // The main render target is always linear RGBA8_UNORM; the blit encodes to sRGB.
        this._createGpuPipeline(
            `${shaderId} pipeline`,
            module.gpuShaderModule,
            [this._cameraGroupLayout, this._textureGroupLayout, this._fragmentGroupLayout],
            TextureFormat.RGBA8_UNORM,
            this._framework.renderer.preferredDepthStencilFormat);
    }

    /** Returns the group 0 bind group, rebuilding it when the projection-view or model buffer changed. */
    private _getCameraBindGroup(): GPUBindGroup {
        const buffers = [
            (this._projectionViewBuffer as WebGpuUniformBuffer).gpuBuffer,
            (this._modelBuffer as WebGpuUniformBuffer).gpuBuffer,
        ];
        if (!this._cameraBindGroup || buffers.some((buffer, i) => buffer !== this._cameraBindGroupBuffers[i])) {
            this._cameraBindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._cameraGroupLayout,
                buffers.map((buffer, binding) => ({binding, resource: {buffer, offset: 0, size: buffer.size}})),
                `${WebGpuInspectTextureMipsRenderPipeline.SHADER_ID} group 0`);
            this._cameraBindGroupBuffers = buffers;
        }
        return this._cameraBindGroup;
    }

    /** Returns the group 2 bind group, rebuilding it when the fragment data buffer changed. */
    private _getFragmentBindGroup(): GPUBindGroup {
        const buffer = (this._fragmentDataBuffer as WebGpuUniformBuffer).gpuBuffer;
        if (!this._fragmentBindGroup || buffer !== this._fragmentBindGroupBuffer) {
            this._fragmentBindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._fragmentGroupLayout,
                [{binding: 2, resource: {buffer, offset: 0, size: buffer.size}}],
                `${WebGpuInspectTextureMipsRenderPipeline.SHADER_ID} group 2`);
            this._fragmentBindGroupBuffer = buffer;
        }
        return this._fragmentBindGroup;
    }

    /** Returns the group 1 bind group for the current texture (or the default one) and sampler, cached per pair. */
    private _getTextureBindGroup(): GPUBindGroup {
        const texture = (this._texture && this._texture.textureState !== State.DISPOSED)
            ? this._texture
            : (this._framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2D();
        const sampler = this._sampler ?? this._defaultTextureSampler;
        const key = `${texture.id}:${sampler.id}`;
        let bindGroup = this._textureBindGroups.get(key);
        if (!bindGroup) {
            bindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._textureGroupLayout, [
                {binding: 0, resource: texture.gpuDefaultView},
                {binding: 1, resource: sampler.gpuSampler},
            ], `${WebGpuInspectTextureMipsRenderPipeline.SHADER_ID} texture group ${key}`);
            this._textureBindGroups.set(key, bindGroup);
            if (!this._watchedTextures.has(texture)) {
                this._watchedTextures.add(texture);
                texture.addOnDisposedListener(this._onTextureDisposed);
            }
        }
        return bindGroup;
    }

    /** Drops the cached bind groups of a disposed texture. */
    private _forgetTexture(texture: ITexture2D): void {
        const prefix = `${texture.id}:`;
        for (const key of [...this._textureBindGroups.keys()]) {
            if (key.startsWith(prefix)) {
                this._textureBindGroups.delete(key);
            }
        }
        this._watchedTextures.delete(texture);
    }

    /**
     * Draws indexed geometry into the current render pass.
     * @param vertexBuffer The vertex buffer, in {@link geometryFormat}.
     * @param indexBuffer The index buffer.
     * @param indicesCount The number of indices to draw. By default, -1 (the rest of the index buffer).
     * @param indicesOffset The first index to draw. By default, 0.
     */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount: number = -1, indicesOffset: number = 0): void {
        if (indicesCount == 0 || !this._gpuPipeline) {
            return;
        }
        const vb = vertexBuffer as WebGpuVertexBuffer;
        const ib = indexBuffer as WebGpuIndexBuffer;
        const encoder = this._graphicsDevice.renderPassEncoder;

        encoder.setPipeline(this._gpuPipeline);
        encoder.setVertexBuffer(0, vb.gpuBuffer, 0, vb.byteSize);
        // The index buffer was allocated padded to 4 bytes; bind the padded size.
        encoder.setIndexBuffer(ib.gpuBuffer, ib.gpuIndexFormat, 0, ib.paddedByteSize);
        encoder.setBindGroup(0, this._getCameraBindGroup());
        encoder.setBindGroup(1, this._getTextureBindGroup());
        encoder.setBindGroup(2, this._getFragmentBindGroup());

        const count = indicesCount < 0 ? ib.indicesCount - indicesOffset : indicesCount;
        encoder.drawIndexed(count, 1, indicesOffset);
    }

    /** Releases the bind groups and stops watching textures. The buffers, texture and sampler are not disposed. */
    public override dispose(): void {
        for (const texture of this._watchedTextures) {
            texture.removeOnDisposedListener(this._onTextureDisposed);
        }
        this._watchedTextures.clear();
        this._textureBindGroups.clear();
        this._cameraBindGroup = null;
        this._cameraBindGroupBuffers = [];
        this._fragmentBindGroup = null;
        this._fragmentBindGroupBuffer = null;
        super.dispose();
    }
}
