
import {IMesh} from "../meshes/IMesh";
import {ITexture2D} from "../rendering/texture/ITexture2D";
import {IInspectTextureMipsRenderPipeline} from "../rendering/render-pipelines/IInspectTextureMipsRenderPipeline";
import {ISampler} from "../rendering/sampler/ISampler";
import {mat4} from "gl-matrix";
import {GeometryFormat} from "../geometry/GeometryFormat";
import {IMaterialFactory} from "./IMaterialFactory";
import {IUniformBuffer} from "../rendering/buffers/IUniformBuffer";
import {IIndexBuffer} from "../rendering/buffers/IIndexBuffer";
import {IVertexBuffer} from "../rendering/buffers/IVertexBuffer";
import {IFramework} from "../IFramework";
import {BufferUsage} from "../rendering/buffers/BufferUsage";
import {Color} from "../data/Color";
import {IUnlitRenderPipeline} from "../rendering/render-pipelines/IUnlitRenderPipeline";
import {IPrimitiveState} from "../rendering/primitive/IPrimitiveState";

/** The additional material config options */
export class UnlitMaterialDescriptor {

    /** The primitive state. */
    public primitiveState?: IPrimitiveState;

    /** The projection view buffer to use */
    public projectionViewBuffer?: IUniformBuffer;
}


/**
 * Unlit material.
 */
export class UnlitMaterial {

    private readonly _framework: IFramework;
    private _color = Color.white();
    private _materialData = [1,1,1,1];
    private _pipeline: IUnlitRenderPipeline;
    private _projectionViewBuffer: IUniformBuffer;
    private _materialBuffer: IUniformBuffer;
    private _modelBuffer: IUniformBuffer;
    private _previousModelMatrix = mat4.create();

    /**
     * The constructor.
     * @param framework
     * @param config
     */
    public constructor(framework: IFramework, config? :UnlitMaterialDescriptor) {
        this._framework = framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._projectionViewBuffer = config?.projectionViewBuffer ?? framework.bufferFactory.createUniformBuffer(this._previousModelMatrix, usage);
        this._modelBuffer = framework.bufferFactory.createUniformBuffer(this._previousModelMatrix, usage);
        this._materialBuffer = framework.bufferFactory.createUniformBuffer(this._materialData, usage);
        this._pipeline = framework.renderPipelineFactory.createUnlitRenderPipeline(
            this._projectionViewBuffer,
            this._modelBuffer,
            this._materialBuffer,
            config?.primitiveState
        );
    }

    /**
     * The diffuse color.
     */
    public diffuseColor: Color = Color.white();

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

        if (!mat4.equals(this._previousModelMatrix, this.modelMatrix)) {
            mat4.copy(this._previousModelMatrix, this.modelMatrix);
            this._modelBuffer.update(this._previousModelMatrix);
        }
    }

    /** @inheritDoc */
    public renderMesh(mesh: IMesh): void {
        this.render(mesh.vertexBuffer!, mesh.indexBuffer!);
    }

    /** @inheritDoc */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer): void {
        this._pipeline.render(vertexBuffer, indexBuffer);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._pipeline.dispose();
        this._projectionViewBuffer.dispose();
        this._modelBuffer.dispose();
        this._materialBuffer.dispose();
    }
}
