import type {IMesh} from "../meshes/IMesh.ts";
import type {ITexture2D} from "../rendering/texture/ITexture2D.ts";
import type {ISampler} from "../rendering/sampler/ISampler.ts";
import {mat4} from "gl-matrix";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IIndexBuffer} from "../rendering/buffers/IIndexBuffer.ts";
import type {IVertexBuffer} from "../rendering/buffers/IVertexBuffer.ts";
import type {IFramework} from "../IFramework.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import {Color} from "../data/Color.ts";
import type {IPrimitiveState} from "../rendering/primitive/IPrimitiveState.ts";
import type {ICamera} from "../camera/ICamera.ts";
import type {LightsBuffer} from "../lights/LightsBuffer.ts";
import type {IForwardBlinnPhongRenderPipeline} from "../rendering/render-pipelines/IForwardBlinnPhongRenderPipeline.ts";

/**
 * The additional material config options.
 * @public
 **/
export class ForwardBlinnPhongMaterialDescriptor {

    /** The primitive state. */
    public primitiveState?: IPrimitiveState;

    /** The camera used to render this material. */
    public camera?: ICamera;
}


/**
 * The Blinn-Phong material with forward calculated lighting.
 * @public
 */
export class ForwardBlinnPhongMaterial {

    private readonly _framework: IFramework;

    private _lightsBuffer?: LightsBuffer;
    private _diffuseColorCache: Color;
    private _ambientColorCache: Color;

    // std140: each vec3 starts on a 16-byte boundary, so pad each colour to 4 floats.
    private _materialData = [
        0.1, 0.1, 0.1, 0, // Ambient
        0.8, 0.8, 0.8, 0, // Diffuse
    ];

    private _pipeline: IForwardBlinnPhongRenderPipeline;
    private _projectionViewBuffer: IUniformBuffer;
    /** False when the projection view buffer came from the descriptor. The caller owns that one. */
    private readonly _ownsProjectionViewBuffer: boolean;
    private _materialBuffer: IUniformBuffer;
    private _modelBuffer: IUniformBuffer;
    private _previousModelMatrix = mat4.create();

    /**
     * The constructor.
     * @param framework The framework.
     * @param descriptor The optional material descriptor. A projection view buffer passed here is shared and is not disposed by this material.
     */
    public constructor(framework: IFramework, descriptor?: ForwardBlinnPhongMaterialDescriptor) {
        this._framework = framework;
        void this._framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._diffuseColorCache = this.diffuseColor.copy();
        this._ambientColorCache = this.ambientColor.copy();
        this._ownsProjectionViewBuffer = !descriptor?.camera?.projectionViewBuffer;
        this._projectionViewBuffer = descriptor?.camera?.projectionViewBuffer ?? framework.bufferFactory.createUniformBuffer(this._previousModelMatrix, usage);
        this._modelBuffer = framework.bufferFactory.createUniformBuffer(this._previousModelMatrix, usage);
        this._materialBuffer = framework.bufferFactory.createUniformBuffer(this._materialData, usage);
        this._pipeline = framework.renderPipelineFactory.createForwardBlinnPhongRenderPipeline({
            projectionViewBuffer: this._projectionViewBuffer,
            modelBuffer: this._modelBuffer,
            materialBuffer: this._materialBuffer,
            primitiveState: descriptor?.primitiveState,
        });
    }

    /**
     * The ambient color of this material.
     * Alpha is ignored. By default, it is (0.1,0.1,0.1).
     */
    public ambientColor: Color = new Color(0.1, 0.1, 0.1);

    /**
     * The diffuse color of this material.
     * Alpha is ignored. By default, it is (0.8,0.8,0.8).
     */
    public diffuseColor: Color = new Color(0.8, 0.8, 0.8);

    /** The lights buffer with the scene's ambient and directional lights. Shared, not disposed by this material. */
    public get lightsBuffer(): LightsBuffer | undefined {
        return this._lightsBuffer;
    }

    /** The lights buffer with the scene's ambient and directional lights. Shared, not disposed by this material. */
    public set lightsBuffer(lightsBuffer: LightsBuffer | undefined) {
        this._lightsBuffer = lightsBuffer;
        if (lightsBuffer) {
            this._pipeline.lightsBuffer = lightsBuffer.buffer;
        }
    }

    /**
     * The texture to inspect.
     */
    public get diffuseTexture(): ITexture2D {
        return this._pipeline.diffuseTexture;
    }

    /**
     * The texture to inspect.
     */
    public set diffuseTexture(value: ITexture2D) {
        this._pipeline.diffuseTexture = value;
    }

    /**
     * The texture sampler.
     */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._pipeline.diffuseTextureSampler;
    }

    /**
     * The texture sampler.
     */
    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._pipeline.diffuseTextureSampler = value;
    }

    /**
     * The model matrix.
     */
    public modelMatrix: mat4 = mat4.create();

    /**
     * The geometry format.
     */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3;

    /** @inheritDoc */
    public beforeRender(): void {


        if (!this._diffuseColorCache.equals(this.diffuseColor) || !this._ambientColorCache.equals(this.ambientColor)) {
            this._ambientColorCache.set(this.ambientColor);
            this._diffuseColorCache.set(this.diffuseColor);
            this._materialData[0] = this._ambientColorCache.r;
            this._materialData[1] = this._ambientColorCache.g;
            this._materialData[2] = this._ambientColorCache.b;
            this._materialData[4] = this._diffuseColorCache.r;
            this._materialData[5] = this._diffuseColorCache.g;
            this._materialData[6] = this._diffuseColorCache.b;
            this._materialBuffer.update(this._materialData);
        }

        if (!mat4.equals(this._previousModelMatrix, this.modelMatrix)) {
            mat4.copy(this._previousModelMatrix, this.modelMatrix);
            this._modelBuffer.update(this._previousModelMatrix);
        }
    }

    /** @inheritDoc */
    public renderMesh(mesh: IMesh): void {
        this.render(mesh.vertexBuffer!, mesh.indexBuffer!, mesh.indexCount ?? -1, mesh.indexStart ?? 0);
    }

    /** @inheritDoc */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void {
        this._pipeline.render(vertexBuffer, indexBuffer, indicesCount, indicesOffset);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._pipeline.dispose();
        if (this._ownsProjectionViewBuffer) {
            this._projectionViewBuffer.dispose();
        }
        this._modelBuffer.dispose();
        this._materialBuffer.dispose();
    }
}
