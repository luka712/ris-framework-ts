import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import type { ITexture2D } from "../rendering/texture/ITexture2D.ts";
import type { IInspectTextureMipsRenderPipeline } from "../rendering/render-pipelines/inspect/IInspectTextureMipsRenderPipeline.ts";
import type { ISampler } from "../rendering/sampler/ISampler.ts";
import {mat4} from "gl-matrix";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IFramework } from "../IFramework.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";

/**
 * Material for inspecting the mip levels of a 2D texture: samples the texture with `textureLod` at {@link mipLevel}.
 * Fragment data is one std140 float `[mipLevel]`. By default, 0.
 */
export class InspectTextureMipsMaterial {

    private readonly _framework: IFramework;
    private _mipLevel = new Float32Array(1);
    /** Created when the model buffer is assigned (the pipeline requires one). */
    private _pipeline?: IInspectTextureMipsRenderPipeline;
    /** Texture and sampler set before the pipeline exists; applied when it is created. */
    private _pendingTexture?: ITexture2D;
    private _pendingSampler?: ISampler;
    private _samplerSet = false;
    private _projectionViewBuffer: IUniformBuffer;
    private _fragmentDataBuffer: IUniformBuffer;
    private _modelBuffer?: IUniformBuffer;

    /**
     * The constructor. Creates the projection view buffer (identity `mat4`, so the quad is drawn in clip space) and the fragment data buffer.
     * The pipeline is created once a {@link modelBuffer} is assigned.
     * @param framework The framework.
     */
    public constructor(framework: IFramework) {
        this._framework = framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._projectionViewBuffer = framework.bufferFactory.createUniformBuffer(mat4.create(), usage);
        this._fragmentDataBuffer = framework.bufferFactory.createUniformBuffer(this._mipLevel, usage);
        // The pipeline is created once a model buffer is assigned (see modelBuffer).
    }

    /** Creates the pipeline with the current bindings. */
    private _createPipeline(modelBuffer: IUniformBuffer): IInspectTextureMipsRenderPipeline {
        const pipeline = this._framework.renderPipelineFactory.createInspectTextureMipsRenderPipeline(
            this._projectionViewBuffer,
            modelBuffer,
            this._fragmentDataBuffer,
        );
        if (this._pendingTexture) {
            pipeline.texture = this._pendingTexture;
        }
        if (this._samplerSet) {
            pipeline.textureSampler = this._pendingSampler;
        }
        this._pipeline = pipeline;
        return pipeline;
    }

    /**
     * The mip level to inspect. Uploaded in {@link beforeRender}. By default, 0.
     */
    public mipLevel: number = 0;

    /**
     * The texture to inspect. By default, unset; the pipeline then samples a 1x1 white texture.
     */
    public get texture(): ITexture2D {
        return this._pipeline?.texture ?? this._pendingTexture!;
    }

    /**
     * The texture to inspect.
     */
    public set texture(value: ITexture2D) {
        this._pendingTexture = value;
        if (this._pipeline) {
            this._pipeline.texture = value;
        }
    }

    /**
     * The texture sampler. By default, the pipeline's default sampler.
     * Use a sampler with a mipmap filter (`MipMapSamplerFilter.NEAREST` or `LINEAR`): without one (the default sampler),
     * sampling is clamped to mip level 0 on WebGL2 and WebGPU.
     */
    public get textureSampler(): ISampler | undefined {
        return this._pipeline ? this._pipeline.textureSampler : this._pendingSampler;
    }

    /**
     * The texture sampler. `undefined` uses the pipeline's default sampler.
     */
    public set textureSampler(value: ISampler | undefined) {
        this._pendingSampler = value;
        this._samplerSet = true;
        if (this._pipeline) {
            this._pipeline.textureSampler = value;
        }
    }

    /**
     * The model buffer (std140 `mat4`). Owned by the mesh, which assigns it before drawing; never disposed by this material.
     * Undefined until assigned: rendering without one throws.
     */
    public get modelBuffer(): IUniformBuffer | undefined {
        return this._modelBuffer;
    }

    /** Binds the model buffer to the pipeline. */
    public set modelBuffer(value: IUniformBuffer | undefined) {
        if (value === this._modelBuffer) {
            return;
        }
        this._modelBuffer = value;
        if (!value) {
            return;
        }
        if (this._pipeline) {
            this._pipeline.modelBuffer = value;
        } else {
            this._createPipeline(value);
        }
    }

    /**
     * The geometry format required by the material: {@link GeometryFormat.POS3_COLOR4_TEXTURECOORDS2}.
     */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2;

    /** Uploads the fragment data when a property changed since the last upload. See {@link IMaterial.beforeRender}. */
    public beforeRender(): void {
        if (this._mipLevel[0] != this.mipLevel) {
            this._mipLevel[0] = this.mipLevel;
            this._fragmentDataBuffer.update(this._mipLevel);
        }
    }

    /**
     * Renders the mesh's index range with its vertex and index buffers. See {@link IMaterial.renderMesh}.
     * @param mesh The mesh. Its model buffer must be assigned to {@link modelBuffer}.
     */
    public renderMesh(mesh: IRenderableMesh): void {
        this.render(mesh.vertexBuffer!, mesh.indexBuffer!, mesh.indexCount ?? -1, mesh.indexStart ?? 0);
    }

    /**
     * Renders indexed geometry. Creates the pipeline on first use. See {@link IMaterial.render}.
     * @param vertexBuffer The vertex buffer, in {@link geometryFormat}.
     * @param indexBuffer The index buffer.
     * @param indicesCount The number of indices to draw. By default, all indices of the index buffer.
     * @param indicesOffset The first index to draw. By default, `0`.
     * @throws Error when no {@link modelBuffer} is assigned.
     */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void {
        if (!this._modelBuffer) {
            throw new Error("InspectTextureMipsMaterial: no modelBuffer. Render it through a mesh (the mesh assigns its model buffer) or set material.modelBuffer.");
        }
        (this._pipeline ?? this._createPipeline(this._modelBuffer)).render(vertexBuffer, indexBuffer, indicesCount, indicesOffset);
    }

    /** Disposes the pipeline and the buffers this material created. The texture, sampler and model buffer are not disposed. */
    public dispose(): void {
        this._pipeline?.dispose();
        this._pipeline = undefined;
        this._projectionViewBuffer.dispose();
        this._fragmentDataBuffer.dispose();
    }
}
