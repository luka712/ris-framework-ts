import type {ICameraMaterial} from "./ICameraMaterial.ts";

import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import type { ITexture2D } from "../rendering/texture/ITexture2D.ts";
import type { ISampler } from "../rendering/sampler/ISampler.ts";
import {mat4} from "gl-matrix";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IFramework } from "../IFramework.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import {Color} from "../data/Color.ts";
import type { IUnlitRenderPipeline } from "../rendering/render-pipelines/IUnlitRenderPipeline.ts";
import type { IPrimitiveState } from "../rendering/primitive/IPrimitiveState.ts";
import type {ICamera} from "../camera/ICamera.ts";

/** The additional material config options */
export class UnlitMaterialDescriptor {

    /** The primitive state. */
    public primitiveState?: IPrimitiveState;

    /** The camera used to render this material. */
    public camera?: ICamera;
}


/**
 * Unlit material.
 */
export class UnlitMaterial implements ICameraMaterial {

    private readonly _framework: IFramework;
    private _color = Color.white();
    private _materialData = [1,1,1,1];
    /** Created when the model buffer is assigned (the pipeline requires one). */
    private _pipeline?: IUnlitRenderPipeline;
    private readonly _primitiveState?: IPrimitiveState;
    /** Texture and sampler set before the pipeline exists; applied when it is created. */
    private _pendingTexture?: ITexture2D;
    private _pendingSampler?: ISampler;
    private _samplerSet = false;
    private _projectionViewBuffer: IUniformBuffer;
    /** False when the projection view buffer came from the descriptor. The caller owns that one. */
    private _ownsProjectionViewBuffer: boolean;
    private _camera?: ICamera;
    private _materialBuffer: IUniformBuffer;
    private _modelBuffer?: IUniformBuffer;

    /**
     * The constructor.
     * @param framework The framework.
     * @param config The optional material descriptor. A projection view buffer passed here is shared and is not disposed by this material.
     */
    public constructor(framework: IFramework, config? :UnlitMaterialDescriptor) {
        this._framework = framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._camera = config?.camera;
        // Without a camera an own zero buffer is bound, so rendering before the scene assigns one does not crash.
        this._ownsProjectionViewBuffer = !config?.camera?.projectionViewBuffer;
        this._projectionViewBuffer = config?.camera?.projectionViewBuffer ?? framework.bufferFactory.createUniformBuffer(mat4.create(), usage);
        this._materialBuffer = framework.bufferFactory.createUniformBuffer(this._materialData, usage);
        this._primitiveState = config?.primitiveState;
        // The pipeline is created once a model buffer is assigned (see modelBuffer).
    }

    /** Creates the pipeline with the current bindings. */
    private _createPipeline(modelBuffer: IUniformBuffer): IUnlitRenderPipeline {
        const pipeline = this._framework.renderPipelineFactory.createUnlitRenderPipeline(
            this._projectionViewBuffer,
            modelBuffer,
            this._materialBuffer,
            this._primitiveState
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
     * The diffuse color.
     */
    public diffuseColor: Color = Color.white();

    /**
     * The texture to inspect.
     */
    public get diffuseTexture(): ITexture2D {
        return this._pipeline?.diffuseTexture ?? this._pendingTexture!;
    }

    /**
     * The texture to inspect.
     */
    public set diffuseTexture(value: ITexture2D) {
        this._pendingTexture = value;
        if (this._pipeline) {
            this._pipeline.diffuseTexture = value;
        }
    }

    /**
     * The texture sampler.
     */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._pipeline ? this._pipeline.diffuseTextureSampler : this._pendingSampler;
    }

    /**
     * The texture sampler.
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
     * The geometry format.
     */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2;

    /** @inheritDoc */
    public beforeRender(): void {
        if (!this._color.equals(this.diffuseColor)) {
            this._color.set(this.diffuseColor);
            this._materialData[0] = this._color.r;
            this._materialData[1] = this._color.g;
            this._materialData[2] = this._color.b;
            this._materialData[3] = this._color.a;
            this._materialBuffer.update(this._materialData);
        }
    }

    /** @inheritDoc */
    public renderMesh(mesh: IRenderableMesh): void {
        this.render(mesh.vertexBuffer!, mesh.indexBuffer!, mesh.indexCount ?? -1, mesh.indexStart ?? 0);
    }

    /** @inheritDoc */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void {
        if (!this._modelBuffer) {
            throw new Error("UnlitMaterial: no modelBuffer. Render it through a mesh (the mesh assigns its model buffer) or set material.modelBuffer.");
        }
        (this._pipeline ?? this._createPipeline(this._modelBuffer)).render(vertexBuffer, indexBuffer, indicesCount, indicesOffset);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._pipeline?.dispose();
        this._pipeline = undefined;
        if (this._ownsProjectionViewBuffer) {
            this._projectionViewBuffer.dispose();
        }
        this._materialBuffer.dispose();
    }
}
