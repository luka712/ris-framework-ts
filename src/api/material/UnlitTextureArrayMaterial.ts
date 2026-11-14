import type {IMaterial} from "./IMaterial.ts";
import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import type {ITexture2DArray} from "../rendering/texture/ITexture2DArray.ts";
import type {ISampler} from "../rendering/sampler/ISampler.ts";
import {mat4} from "gl-matrix";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IIndexBuffer} from "../rendering/buffers/IIndexBuffer.ts";
import type {IVertexBuffer} from "../rendering/buffers/IVertexBuffer.ts";
import type {IFramework} from "../IFramework.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import {Color} from "../data/Color.ts";
import type {IUnlitTextureArrayRenderPipeline} from "../rendering/render-pipelines/IUnlitTextureArrayRenderPipeline.ts";
import type {IPrimitiveState} from "../rendering/primitive/IPrimitiveState.ts";
import type {ICamera} from "../camera/ICamera.ts";
import type {IUnlitMaterialDescriptor} from "./IUnlitMaterialDescriptor.ts";

/**
 * Unlit material that samples one layer of a 2D texture array (`sampler2DArray` in GLSL, `texture_2d_array` in WGSL).
 * Separate from {@link UnlitMaterial}, which samples a 2D texture. Works on WebGL2 and WebGPU.
 *
 * The output color is `texture(diffuseTexture, uv, layer) * vertexColor * diffuseColor`.
 * Material data is std140 floats `[r, g, b, a, layer, padding, padding, padding]`.
 */
export class UnlitTextureArrayMaterial implements IMaterial {

    private readonly _framework: IFramework;
    private readonly _color = Color.white();
    /** `[r, g, b, a, layer, padding, padding, padding]`. Padding stays 0. */
    private readonly _materialData = new Float32Array([1, 1, 1, 1, 0, 0, 0, 0]);
    /** Created when the model buffer is assigned (the pipeline requires one). */
    private _pipeline?: IUnlitTextureArrayRenderPipeline;
    private readonly _primitiveState?: IPrimitiveState;
    /** Texture and sampler set before the pipeline exists; applied when it is created. */
    private _pendingTexture?: ITexture2DArray;
    private _pendingSampler?: ISampler;
    private _samplerSet = false;
    private _projectionViewBuffer: IUniformBuffer;
    /** False when the projection view buffer came from a camera. The camera owns that one. */
    private _ownsProjectionViewBuffer: boolean;
    private _camera?: ICamera;
    private readonly _materialBuffer: IUniformBuffer;
    private _modelBuffer?: IUniformBuffer;

    /**
     * The constructor. Creates the material buffer, and a placeholder projection view buffer when the descriptor has no camera.
     * The pipeline is created once a {@link modelBuffer} is assigned.
     * @param framework The framework.
     * @param descriptor The optional descriptor. By default, no camera and the pipeline's default primitive state.
     * A camera's projection view buffer is shared and is not disposed by this material.
     */
    public constructor(framework: IFramework, descriptor?: IUnlitMaterialDescriptor) {
        this._framework = framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._camera = descriptor?.camera;
        // Without a camera an own identity buffer is bound, so rendering before the scene assigns one does not crash.
        this._ownsProjectionViewBuffer = !this._camera?.projectionViewBuffer;
        this._projectionViewBuffer = this._camera?.projectionViewBuffer ?? framework.bufferFactory.createUniformBuffer(mat4.create(), usage);
        this._materialBuffer = framework.bufferFactory.createUniformBuffer(this._materialData, usage);
        this._primitiveState = descriptor?.primitiveState;
    }

    /** Creates the pipeline with the current bindings. */
    private _createPipeline(modelBuffer: IUniformBuffer): IUnlitTextureArrayRenderPipeline {
        const pipeline = this._framework.renderPipelineFactory.createUnlitTextureArrayRenderPipeline(
            this._projectionViewBuffer,
            modelBuffer,
            this._materialBuffer,
            this._primitiveState,
        );
        if (this._pendingTexture) {
            pipeline.diffuseTexture = this._pendingTexture;
        }
        if (this._samplerSet) {
            pipeline.diffuseTextureSampler = this._pendingSampler;
        }
        this._pipeline = pipeline;
        return pipeline;
    }

    /**
     * The camera. Setting it binds the camera's projection view buffer to the pipeline
     * (the material's own placeholder buffer is disposed). Setting undefined keeps the last bound buffer.
     * By default, the descriptor's camera, or undefined.
     */
    public get camera(): ICamera | undefined {
        return this._camera;
    }

    /** @inheritDoc */
    public set camera(camera: ICamera | undefined) {
        if (camera === this._camera) {
            return;
        }
        this._camera = camera;
        if (!camera) {
            return;
        }
        if (this._ownsProjectionViewBuffer) {
            this._projectionViewBuffer.dispose();
            this._ownsProjectionViewBuffer = false;
        }
        this._projectionViewBuffer = camera.projectionViewBuffer;
        if (this._pipeline) {
            this._pipeline.projectionViewBuffer = this._projectionViewBuffer;
        }
    }

    /**
     * The diffuse color, multiplied with the sampled texel and the vertex color. By default, white.
     */
    public diffuseColor: Color = Color.white();

    /**
     * The array layer to sample. Uploaded as a float and truncated to an integer layer in the shader. By default, 0.
     */
    public layer: number = 0;

    /**
     * The texture array. By default, unset; the pipeline then samples the texture factory's 1x1, one-layer white texture array.
     */
    public get diffuseTexture(): ITexture2DArray {
        return this._pipeline?.diffuseTexture ?? this._pendingTexture!;
    }

    /**
     * The texture array. Not disposed by this material.
     */
    public set diffuseTexture(value: ITexture2DArray) {
        this._pendingTexture = value;
        if (this._pipeline) {
            this._pipeline.diffuseTexture = value;
        }
    }

    /**
     * The texture sampler. By default, the pipeline's default sampler.
     */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._pipeline ? this._pipeline.diffuseTextureSampler : this._pendingSampler;
    }

    /**
     * The texture sampler. `undefined` uses the pipeline's default sampler. Not disposed by this material.
     */
    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._pendingSampler = value;
        this._samplerSet = true;
        if (this._pipeline) {
            this._pipeline.diffuseTextureSampler = value;
        }
    }

    /**
     * The model buffer (std140 `mat4`). Owned by the mesh, which assigns it before drawing; never disposed by this material.
     * Undefined until assigned: rendering without one throws.
     */
    public get modelBuffer(): IUniformBuffer | undefined {
        return this._modelBuffer;
    }

    /** Binds the model buffer to the pipeline, creating the pipeline on first assignment. */
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

    /** Uploads the material data when {@link diffuseColor} or {@link layer} changed since the last upload. See {@link IMaterial.beforeRender}. */
    public beforeRender(): void {
        if (!this._color.equals(this.diffuseColor) || this._materialData[4] != this.layer) {
            this._color.set(this.diffuseColor);
            this._materialData[0] = this._color.r;
            this._materialData[1] = this._color.g;
            this._materialData[2] = this._color.b;
            this._materialData[3] = this._color.a;
            this._materialData[4] = this.layer;
            this._materialBuffer.update(this._materialData);
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
     * Renders indexed geometry. See {@link IMaterial.render}.
     * @param vertexBuffer The vertex buffer, in {@link geometryFormat}.
     * @param indexBuffer The index buffer.
     * @param indicesCount The number of indices to draw. By default, all indices of the index buffer.
     * @param indicesOffset The first index to draw. By default, `0`.
     * @throws Error when no {@link modelBuffer} is assigned.
     */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void {
        if (!this._modelBuffer) {
            throw new Error("UnlitTextureArrayMaterial.render: no modelBuffer. Render it through a mesh (the mesh assigns its model buffer) or set material.modelBuffer.");
        }
        (this._pipeline ?? this._createPipeline(this._modelBuffer)).render(vertexBuffer, indexBuffer, indicesCount, indicesOffset);
    }

    /** Disposes the pipeline and the buffers this material created. The texture, sampler, camera and model buffer are not disposed. */
    public dispose(): void {
        this._pipeline?.dispose();
        this._pipeline = undefined;
        if (this._ownsProjectionViewBuffer) {
            this._projectionViewBuffer.dispose();
        }
        this._materialBuffer.dispose();
    }
}
