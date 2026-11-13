import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import type {ITexture2DArray} from "../rendering/texture/ITexture2DArray.ts";
import type {IInspectTextureArrayRenderPipeline} from "../rendering/render-pipelines/inspect/IInspectTextureArrayRenderPipeline.ts";
import type {ISampler} from "../rendering/sampler/ISampler.ts";
import {mat4} from "gl-matrix";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IIndexBuffer} from "../rendering/buffers/IIndexBuffer.ts";
import type {IVertexBuffer} from "../rendering/buffers/IVertexBuffer.ts";
import type {IFramework} from "../IFramework.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";

/**
 * Material for inspecting a 2D texture array.
 * Fragment data is std140 floats `[inspectLod, layer, mipLevel, padding]`.
 * `inspectLod` is stored as 0 or 1. By default, 0 (sample the layer with `texture()`).
 * `layer` and `mipLevel` are 0 by default. Padding stays 0.
 */
export class InspectTextureArrayMaterial {

    private readonly _framework: IFramework;
    /** `[inspectLod, layer, mipLevel, padding]`. Padding is unused. */
    private readonly _fragmentData = new Float32Array(4);
    /** Created when the model buffer is assigned (the pipeline requires one). */
    private _pipeline?: IInspectTextureArrayRenderPipeline;
    /** Texture and sampler set before the pipeline exists; applied when it is created. */
    private _pendingTexture?: ITexture2DArray;
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
        this._fragmentDataBuffer = framework.bufferFactory.createUniformBuffer(this._fragmentData, usage);
    }

    /** Creates the pipeline with the current bindings. */
    private _createPipeline(modelBuffer: IUniformBuffer): IInspectTextureArrayRenderPipeline {
        const pipeline = this._framework.renderPipelineFactory.createInspectTextureArrayRenderPipeline(
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
     * When true, the shader samples with `textureLod` at {@link mipLevel}.
     * Stored in the uniform buffer as 1 or 0. By default, false.
     */
    public inspectLod: boolean = false;

    /**
     * The array layer to sample. By default, 0.
     */
    public layer: number = 0;

    /**
     * The mip level used when {@link inspectLod} is true. By default, 0.
     */
    public mipLevel: number = 0;

    /**
     * The texture array to inspect. By default, unset; the pipeline then samples a 1x1 white texture array.
     */
    public get texture(): ITexture2DArray {
        return this._pipeline?.texture ?? this._pendingTexture!;
    }

    /**
     * The texture array to inspect.
     */
    public set texture(value: ITexture2DArray) {
        this._pendingTexture = value;
        if (this._pipeline) {
            this._pipeline.texture = value;
        }
    }

    /**
     * The texture sampler. By default, the pipeline's default sampler.
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
        const inspectLod = this.inspectLod ? 1 : 0;
        if (this._fragmentData[0] != inspectLod || this._fragmentData[1] != this.layer || this._fragmentData[2] != this.mipLevel) {
            this._fragmentData[0] = inspectLod;
            this._fragmentData[1] = this.layer;
            this._fragmentData[2] = this.mipLevel;
            this._fragmentDataBuffer.update(this._fragmentData);
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
            throw new Error("InspectTextureArrayMaterial: no modelBuffer. Render it through a mesh (the mesh assigns its model buffer) or set material.modelBuffer.");
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
