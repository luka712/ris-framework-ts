import {mat4} from "gl-matrix";
import type { GeometryFormat } from "../geometry/GeometryFormat.ts";
import type { IMesh } from "../meshes/IMesh.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";
import type { ITexture2D } from "../rendering/texture/ITexture2D.ts";
import type { ISampler } from "../rendering/sampler/ISampler.ts";
import type { IFramework } from "../IFramework.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import type { ISpriteRenderPipeline } from "../rendering/render-pipelines/ISpriteRenderPipeline.ts";
import type { IMaterial } from "./IMaterial.ts";

/** The sprite material descriptor. */
export interface SpriteMaterialDescriptor {

    /** The projection view buffer. Shared, it is not disposed by the material. */
    projectionViewBuffer: IUniformBuffer;

    /** The sprite texture. */
    texture: ITexture2D;

    /** The texture sampler. */
    sampler: ISampler;
}

/**
 * The sprite material.
 */
export class SpriteMaterial implements IMaterial {

    private readonly _renderPipeline: ISpriteRenderPipeline;

    /**
     * The constructor.
     * @param framework - The framework.
     * @param descriptor - The sprite material descriptor.
     */
    public constructor(framework: IFramework, descriptor: SpriteMaterialDescriptor) {
        this._renderPipeline = framework.renderPipelineFactory.createSpriteRenderPipeline(descriptor.projectionViewBuffer);
        this._renderPipeline.textureSampler = descriptor.sampler;
        this._renderPipeline.spriteTexture = descriptor.texture;
        this.modelMatrix = mat4.create();
    }

    /** @inheritDoc */
    public modelMatrix: mat4;

    /** @inheritDoc */
    public get geometryFormat(): GeometryFormat {
        return this._renderPipeline.geometryFormat;
    }

    /** The sprite texture. */
    public get texture(): ITexture2D {
        return this._renderPipeline.spriteTexture;
    }

    /** The sprite texture. */
    public set texture(value: ITexture2D) {
        this._renderPipeline.spriteTexture = value;
    }

    /** @inheritDoc */
    public beforeRender(): void {
        // Nothing to do
    }

    /** @inheritDoc */
    public renderMesh(mesh: IMesh): void {
        this.render(mesh.vertexBuffer!, mesh.indexBuffer!);
    }

    /**
     * Renders the material.
     * @param vertexBuffer - The vertex buffer.
     * @param indexBuffer - The index buffer.
     * @param indicesCount - The number of indices to draw. If -1 draws all indices.
     * @param indicesOffset - Indices offset. Defaults to 0.
     */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void {
        this._renderPipeline.render(vertexBuffer, indexBuffer, indicesCount, indicesOffset);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._renderPipeline.dispose();
    }
}
