import {
    GeometryFormat,
    type IFramework,
    type IIndexBuffer,
    type IUnlitTextureArrayRenderPipeline,
    type IPrimitiveState,
    type ISampler,
    type IUniformBuffer,
    type IVertexBuffer,
    State,
    TextureFormat,
} from "../../../api/index.ts";
import type {ITexture2DArray} from "../../../api/rendering/texture/ITexture2DArray.ts";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout.ts";
import {AWebGpuRenderPipeline} from "../AWebGpuRenderPipeline.ts";
import {WebGpuTexture2DArray} from "../../texture/WebGpuTexture2DArray.ts";
import type {WebGpuSampler} from "../../sampler/WebGpuSampler.ts";
import type {WebGpuUniformBuffer} from "../../buffers/WebGpuUniformBuffer.ts";
import type {WebGpuVertexBuffer} from "../../buffers/WebGpuVertexBuffer.ts";
import type {WebGpuIndexBuffer} from "../../buffers/WebGpuIndexBuffer.ts";
import type {WebGpuShaderModule} from "../../shader/WebGpuShaderModule.ts";
import {WebGpuUtilities} from "../../utilities/WebGpuUtilities.ts";
import { WebGpuTextureFactory } from "../../texture/WebGpuTextureFactory.ts";

/**
 * The WebGPU implementation of {@link IUnlitTextureArrayRenderPipeline}, mirroring the WebGL one.
 * Uses the `unlit_texture_array_material` WGSL shader (`texture_2d_array<f32>`, sampled through a `2d-array` view).
 *
 * Group 0: projection-view (0), model (1), vertex. Group 1: texture array (0), sampler (1), fragment.
 * Group 2: material (2), fragment.
 * A 1x1, one-layer white texture array is used when no texture is set.
 * @internal
 */
export class WebGpuUnlitTextureArrayRenderPipeline extends AWebGpuRenderPipeline implements IUnlitTextureArrayRenderPipeline {

    private static readonly SHADER_ID = "unlit_texture_array_material";

    private _texture: WebGpuTexture2DArray | null = null;
    private _sampler?: WebGpuSampler;
    private _projectionViewBuffer: IUniformBuffer;
    private _modelBuffer: IUniformBuffer;
    private _materialBuffer: IUniformBuffer;

    private _cameraGroupLayout: GPUBindGroupLayout = null!;
    private _textureGroupLayout: GPUBindGroupLayout = null!;
    private _materialGroupLayout: GPUBindGroupLayout = null!;

    /** Rebuilt when the projection-view or model buffer changes. */
    private _cameraBindGroup: GPUBindGroup | null = null;
    private _cameraBindGroupBuffers: GPUBuffer[] = [];
    /** Rebuilt when the material buffer changes. */
    private _materialBindGroup: GPUBindGroup | null = null;
    private _materialBindGroupBuffer: GPUBuffer | null = null;

    /** Texture bind groups, keyed by `textureId:samplerId`. Forgotten when the texture is disposed. */
    private readonly _textureBindGroups = new Map<string, GPUBindGroup>();
    private readonly _watchedTextures = new Set<ITexture2DArray>();
    private readonly _onTextureDisposed = (texture: ITexture2DArray) => this._forgetTexture(texture);

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection view buffer (one `mat4`).
     * @param modelBuffer The model buffer (one `mat4`). Required.
     * @param materialBuffer The material buffer. See {@link materialBuffer}.
     * @param primitiveState The primitive state. By default, the graphics device's default primitive state.
     * @throws Error when `modelBuffer` is missing.
     */
    public constructor(framework: IFramework,
                       projectionViewBuffer: IUniformBuffer,
                       modelBuffer: IUniformBuffer,
                       materialBuffer: IUniformBuffer,
                       primitiveState?: IPrimitiveState) {
        if (!modelBuffer) {
            throw new Error("WebGpuUnlitTextureArrayRenderPipeline: modelBuffer is required (the mesh's model buffer, mat4).");
        }
        super(framework, primitiveState);
        this._projectionViewBuffer = projectionViewBuffer;
        this._modelBuffer = modelBuffer;
        this._materialBuffer = materialBuffer;
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
            throw new Error("WebGpuUnlitTextureArrayRenderPipeline: modelBuffer is required (the mesh's model buffer, mat4).");
        }
        this._modelBuffer = value;
    }

    /** @inheritDoc */
    public get materialBuffer(): IUniformBuffer {
        return this._materialBuffer;
    }

    /** @inheritDoc */
    public set materialBuffer(value: IUniformBuffer) {
        this._materialBuffer = value;
    }

    /** @inheritDoc */
    public get diffuseTexture(): ITexture2DArray {
        return this._texture ?? (this._framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2DArray();
    }

    /** @inheritDoc */
    public set diffuseTexture(value: ITexture2DArray) {
        this._texture = (value as WebGpuTexture2DArray) ?? null;
    }

    /** @inheritDoc */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._sampler;
    }

    /** @inheritDoc */
    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._sampler = value as WebGpuSampler | undefined;
    }

    /** Loads the `unlit_texture_array_material` WGSL module, creates the bind group layouts and the render pipeline. */
    public initialize(): void {
        const device = this._graphicsDevice.device;
        const shaderId = WebGpuUnlitTextureArrayRenderPipeline.SHADER_ID;
        const module = this._framework.content.loadShaderModule(shaderId) as WebGpuShaderModule;
        const entries = WebGpuUtilities.bindGroupLayoutEntry;

        this._cameraGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createUniformBufferBindGroupLayoutEntry(0, GPUShaderStage.VERTEX),
            entries.createUniformBufferBindGroupLayoutEntry(1, GPUShaderStage.VERTEX),
        ], `${shaderId} group 0 layout`);

        this._textureGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createTextureBindGroupLayoutEntry(0, GPUShaderStage.FRAGMENT, "float", "2d-array"),
            entries.createSamplerBindGroupLayoutEntry(1, GPUShaderStage.FRAGMENT),
        ], `${shaderId} texture group layout`);

        this._materialGroupLayout = WebGpuUtilities.bindGroupLayout.create(device, [
            entries.createUniformBufferBindGroupLayoutEntry(2, GPUShaderStage.FRAGMENT),
        ], `${shaderId} group 2 layout`);

        // The main render target is always linear RGBA8_UNORM; the blit encodes to sRGB.
        this._createGpuPipeline(
            `${shaderId} pipeline`,
            module.gpuShaderModule,
            [this._cameraGroupLayout, this._textureGroupLayout, this._materialGroupLayout],
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
                `${WebGpuUnlitTextureArrayRenderPipeline.SHADER_ID} group 0`);
            this._cameraBindGroupBuffers = buffers;
        }
        return this._cameraBindGroup;
    }

    /** Returns the group 2 bind group, rebuilding it when the material buffer changed. */
    private _getMaterialBindGroup(): GPUBindGroup {
        const buffer = (this._materialBuffer as WebGpuUniformBuffer).gpuBuffer;
        if (!this._materialBindGroup || buffer !== this._materialBindGroupBuffer) {
            this._materialBindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._materialGroupLayout,
                [{binding: 2, resource: {buffer, offset: 0, size: buffer.size}}],
                `${WebGpuUnlitTextureArrayRenderPipeline.SHADER_ID} group 2`);
            this._materialBindGroupBuffer = buffer;
        }
        return this._materialBindGroup;
    }

    /** Returns the group 1 bind group for the current texture array (or the default one) and sampler, cached per pair. */
    private _getTextureBindGroup(): GPUBindGroup {
        const texture = (this._texture && this._texture.textureState !== State.DISPOSED)
            ? this._texture
            : (this._framework.textureFactory as WebGpuTextureFactory).getOrCreateDefaultTexture2DArray();
        const sampler = this._sampler ?? this._defaultTextureSampler;
        const key = `${texture.id}:${sampler.id}`;
        let bindGroup = this._textureBindGroups.get(key);
        if (!bindGroup) {
            bindGroup = WebGpuUtilities.bindGroup.create(this._graphicsDevice.device, this._textureGroupLayout, [
                {binding: 0, resource: texture.gpuDefaultView},
                {binding: 1, resource: sampler.gpuSampler},
            ], `${WebGpuUnlitTextureArrayRenderPipeline.SHADER_ID} texture group ${key}`);
            this._textureBindGroups.set(key, bindGroup);
            if (!this._watchedTextures.has(texture)) {
                this._watchedTextures.add(texture);
                texture.addOnDisposedListener(this._onTextureDisposed);
            }
        }
        return bindGroup;
    }

    /** Drops the cached bind groups of a disposed texture array. */
    private _forgetTexture(texture: ITexture2DArray): void {
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
        encoder.setBindGroup(2, this._getMaterialBindGroup());

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
        this._materialBindGroup = null;
        this._materialBindGroupBuffer = null;
        super.dispose();
    }
}
