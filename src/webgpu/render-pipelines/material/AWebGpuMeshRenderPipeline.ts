import {
    type IFramework,
    type IIndexBuffer,
    type IPrimitiveState,
    type ISampler,
    type ITexture2D,
    type IUniformBuffer,
    type IVertexBuffer,
    State,
} from "../../../api/index.ts";
import {AWebGpuRenderPipeline} from "../AWebGpuRenderPipeline.ts";
import {WebGpuTexture2D} from "../../texture/WebGpuTexture2D.ts";
import type {WebGpuSampler} from "../../sampler/WebGpuSampler.ts";
import type {WebGpuUniformBuffer} from "../../buffers/WebGpuUniformBuffer.ts";
import type {WebGpuVertexBuffer} from "../../buffers/WebGpuVertexBuffer.ts";
import type {WebGpuIndexBuffer} from "../../buffers/WebGpuIndexBuffer.ts";
import type {WebGpuShaderModule} from "../../shader/WebGpuShaderModule.ts";
import {
    GpuShaderStage,
    type GpuBindGroup,
    type GpuBindGroupLayout,
    type GpuBuffer,
} from "../../WebGpuTypes.ts";

/**
 * One uniform buffer binding of a uniform bind group.
 * @internal
 */
export interface IWebGpuUniformBinding {
    /** The WGSL `@binding`. */
    binding: number;
    /** The shader stages that read it. */
    visibility: number;
    /** Returns the current buffer. */
    buffer: () => IUniformBuffer;
}

/**
 * A uniform-buffer-only bind group. The bind group is rebuilt when any of its buffers change (dirty check).
 * @internal
 */
export interface IWebGpuUniformGroup {
    /** The WGSL `@group`. */
    group: number;
    /** The bindings. */
    bindings: IWebGpuUniformBinding[];
}

interface UniformGroupState {
    descriptor: IWebGpuUniformGroup;
    layout: GpuBindGroupLayout;
    bindGroup: GpuBindGroup | null;
    lastBuffers: GpuBuffer[];
}

/**
 * The base of WebGPU mesh pipelines, like the C# `AWebGPUMeshRenderPipeline`:
 * uniform groups with dirty checks, plus one texture + sampler group cached per texture and sampler id.
 * A 1x1 white texture is used when no texture is set.
 * @internal
 */
export abstract class AWebGpuMeshRenderPipeline extends AWebGpuRenderPipeline {

    private _uniformGroups: UniformGroupState[] = [];
    private _textureGroupIndex = 1;
    private _textureGroupLayout: GpuBindGroupLayout = null!;
    private readonly _textureBindGroups = new Map<string, GpuBindGroup>();
    private readonly _watchedTextures = new Set<ITexture2D>();
    private readonly _onTextureDisposed = (texture: ITexture2D) => this._forgetTexture(texture);

    protected _texture: WebGpuTexture2D | null = null;
    protected _sampler?: WebGpuSampler;

    /**
     * The constructor.
     * @param framework The framework.
     * @param primitiveState The optional primitive state.
     */
    protected constructor(framework: IFramework, primitiveState?: IPrimitiveState) {
        super(framework, primitiveState);
    }

    /** The shader id to load. */
    protected abstract readonly _shaderId: string;

    /** The uniform groups. */
    protected abstract _describeUniformGroups(): IWebGpuUniformGroup[];

    /** The group index used for texture + sampler. */
    protected get _textureGroup(): number {
        return 1;
    }

    /** @inheritDoc */
    public get diffuseTexture(): ITexture2D {
        return this._texture ?? WebGpuTexture2D.getOrCreateDefault(this._framework);
    }

    /** @inheritDoc */
    public set diffuseTexture(value: ITexture2D) {
        this._texture = (value as WebGpuTexture2D) ?? null;
    }

    /** @inheritDoc */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._sampler;
    }

    /** @inheritDoc */
    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._sampler = value as WebGpuSampler | undefined;
    }

    /** @inheritDoc */
    public initialize(): void {
        const device = this._graphicsDevice.device;
        const module = this._framework.content.loadShaderModule(this._shaderId) as WebGpuShaderModule;

        this._textureGroupIndex = this._textureGroup;
        this._textureGroupLayout = device.createBindGroupLayout({
            label: `${this._shaderId} texture group layout`,
            entries: [
                {binding: 0, visibility: GpuShaderStage.FRAGMENT, texture: {sampleType: "float"}},
                {binding: 1, visibility: GpuShaderStage.FRAGMENT, sampler: {type: "filtering"}},
            ],
        });

        this._uniformGroups = this._describeUniformGroups().map(descriptor => ({
            descriptor,
            layout: device.createBindGroupLayout({
                label: `${this._shaderId} group ${descriptor.group} layout`,
                entries: descriptor.bindings.map(b => ({binding: b.binding, visibility: b.visibility, buffer: {type: "uniform"}})),
            }),
            bindGroup: null,
            lastBuffers: [],
        }));

        const groupCount = Math.max(this._textureGroupIndex, ...this._uniformGroups.map(g => g.descriptor.group)) + 1;
        const layouts: GpuBindGroupLayout[] = [];
        for (let i = 0; i < groupCount; i++) {
            const layout = i === this._textureGroupIndex
                ? this._textureGroupLayout
                : this._uniformGroups.find(g => g.descriptor.group === i)?.layout;
            if (!layout) {
                throw new Error(`${this._shaderId}: bind group ${i} has no layout.`);
            }
            layouts.push(layout);
        }

        const renderer = this._framework.renderer;
        this._createGpuPipeline(
            `${this._shaderId} pipeline`,
            module.gpuShaderModule,
            layouts,
            renderer.preferredTextureFormat,
            renderer.preferredDepthStencilFormat);
    }

    private _getUniformBindGroup(state: UniformGroupState): GpuBindGroup {
        const buffers = state.descriptor.bindings.map(b => (b.buffer() as WebGpuUniformBuffer).gpuBuffer);
        const dirty = !state.bindGroup
            || buffers.length !== state.lastBuffers.length
            || buffers.some((buffer, i) => buffer !== state.lastBuffers[i]);
        if (dirty) {
            state.bindGroup = this._graphicsDevice.device.createBindGroup({
                label: `${this._shaderId} group ${state.descriptor.group}`,
                layout: state.layout,
                entries: state.descriptor.bindings.map((b, i) => ({
                    binding: b.binding,
                    resource: {buffer: buffers[i], offset: 0, size: buffers[i].size},
                })),
            });
            state.lastBuffers = buffers;
        }
        return state.bindGroup!;
    }

    private _getTextureBindGroup(): GpuBindGroup {
        const texture = (this._texture && this._texture.textureState !== State.DISPOSED)
            ? this._texture
            : WebGpuTexture2D.getOrCreateDefault(this._framework);
        const sampler = this._sampler ?? this._defaultTextureSampler;
        const key = `${texture.id}:${sampler.id}`;
        let bindGroup = this._textureBindGroups.get(key);
        if (!bindGroup) {
            bindGroup = this._graphicsDevice.device.createBindGroup({
                label: `${this._shaderId} texture group ${key}`,
                layout: this._textureGroupLayout,
                entries: [
                    {binding: 0, resource: texture.gpuDefaultView},
                    {binding: 1, resource: sampler.gpuSampler},
                ],
            });
            this._textureBindGroups.set(key, bindGroup);
            if (!this._watchedTextures.has(texture)) {
                this._watchedTextures.add(texture);
                texture.addOnDisposedListener(this._onTextureDisposed);
            }
        }
        return bindGroup;
    }

    private _forgetTexture(texture: ITexture2D): void {
        const prefix = `${texture.id}:`;
        for (const key of [...this._textureBindGroups.keys()]) {
            if (key.startsWith(prefix)) {
                this._textureBindGroups.delete(key);
            }
        }
        this._watchedTextures.delete(texture);
    }

    /** @inheritDoc */
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

        for (const state of this._uniformGroups) {
            encoder.setBindGroup(state.descriptor.group, this._getUniformBindGroup(state));
        }
        encoder.setBindGroup(this._textureGroupIndex, this._getTextureBindGroup());

        // Range draws: firstIndex is the index offset, count defaults to the rest of the buffer.
        const count = indicesCount < 0 ? ib.indicesCount - indicesOffset : indicesCount;
        encoder.drawIndexed(count, 1, indicesOffset);
    }

    /** @inheritDoc */
    public override dispose(): void {
        for (const texture of this._watchedTextures) {
            texture.removeOnDisposedListener(this._onTextureDisposed);
        }
        this._watchedTextures.clear();
        this._textureBindGroups.clear();
        for (const state of this._uniformGroups) {
            state.bindGroup = null;
        }
        super.dispose();
    }
}
