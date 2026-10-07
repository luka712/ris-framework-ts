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

/**
 * Material for inspecting texture mips.
 */
export class InspectTextureMipsMaterial {

    private readonly _framework: IFramework;
    private _mipLevel = [0];
    private _pipeline: IInspectTextureMipsRenderPipeline;
    private _projectionViewBuffer: IUniformBuffer;
    private _fragmentDataBuffer: IUniformBuffer;
    private _modelBuffer: IUniformBuffer;
    private _previousModelMatrix = mat4.create();

    public constructor(framework: IFramework) {
        this._framework = framework;
        const usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._projectionViewBuffer = framework.bufferFactory.createUniformBuffer(this._previousModelMatrix, usage);
        this._modelBuffer = framework.bufferFactory.createUniformBuffer(this._previousModelMatrix, usage);
        this._fragmentDataBuffer = framework.bufferFactory.createUniformBuffer(this._mipLevel, usage);
        this._pipeline = framework.renderPipelineFactory.createInspectTextureMipsRenderPipeline(
            this._projectionViewBuffer,
            this._modelBuffer,
            this._fragmentDataBuffer,
        );
    }

    /**
     * The mip level to inspect.
     */
    public mipLevel: number = 0;

    /**
     * The texture to inspect.
     */
    public get texture(): ITexture2D {
        return this._pipeline.spriteTexture;
    }

    /**
     * The texture to inspect.
     */
    public set texture(value: ITexture2D) {
        this._pipeline.spriteTexture = value;
    }

    /**
     * The texture sampler.
     */
    public get textureSampler(): ISampler | undefined {
        return this._pipeline.textureSampler;
    }

    /**
     * The texture sampler.
     */
    public set textureSampler(value: ISampler | undefined) {
        this._pipeline.textureSampler = value;
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
        if (this._mipLevel[0] != this.mipLevel) {
            this._mipLevel[0] = this.mipLevel;
            this._fragmentDataBuffer.update(this._mipLevel);
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
        this._fragmentDataBuffer.dispose();
    }
}
