import type {
    IFramework,
    ISpriteRenderPipeline,
    ITexture2D,
    IUniformBuffer,
    Color,
    IDisposable, ISampler
} from "ris-framework-api";
import {SpriteBatchMesh} from "./SpriteBatchMesh.ts";
import type {vec2, vec3} from "gl-matrix";

/**
 * The drawable class for sprite batch.
 */
export class SpriteBatchDrawable implements IDisposable {

    private readonly _framework: IFramework;
    private readonly _texture: ITexture2D;
    private readonly _sampler: ISampler;
    private _maxBatchSize: number;
    private _drawingMesh: SpriteBatchMesh = null!;
    private _renderPipeline: ISpriteRenderPipeline = null!;

    private _needsResize = false;

    private _fromInstance = 0;
    private _toInstance = 0;

    /**
     * The constructor.
     * @param framework The framework.
     * @param texture The texture.
     * @param sampler The sampler.
     * @param projectionViewBuffer The projection view buffer.
     * @param maxBatchSize The maximum size of batch.
     */
    public constructor(
        framework: IFramework,
        texture: ITexture2D,
        sampler: ISampler,
        projectionViewBuffer: IUniformBuffer,
        maxBatchSize: number) {
        this._framework = framework;
        this._texture = texture;
        this._sampler = sampler;
        this._maxBatchSize = maxBatchSize;
        this.projectionViewBuffer = projectionViewBuffer;
    }

    /**
     * The projection view buffer.
     */
    public readonly projectionViewBuffer: IUniformBuffer;

    /** Initialize the drawable */
    public initialize(): void {
        this._renderPipeline = this._framework
            .renderPipelineFactory
            .createSpriteRenderPipeline(this.projectionViewBuffer);
        this._renderPipeline.spriteTexture = this._texture;
        this._renderPipeline.textureSampler = this._sampler;

        this._drawingMesh = new SpriteBatchMesh(this._framework, this._maxBatchSize);
        this._drawingMesh.initialize();
    }

    /**
     * Resets the batch for new draw operation.
     */
    public reset(): void {
        // Nothing is drawn yet.
        this._fromInstance = 0;
        this._toInstance = 0;
    }

    /**
     * Writes a sprite to the batch sprite mesh.
     *
     * @param position - The position of the sprite.
     * @param size - The size of the sprite.
     * @param color - The color of the sprite.
     * @param u0 - The minimum U texture coordinate. Defaults to `0`.
     * @param v0 - The minimum V texture coordinate. Defaults to `0`.
     * @param u1 - The maximum U texture coordinate. Defaults to `1`.
     * @param v1 - The maximum V texture coordinate. Defaults to `1`.
     * @param flipY - Whether to vertically flip the texture coordinates. Defaults to `false`.
     */
    public writeSprite(
        position: vec3, size: vec2, color: Color,
        u0 = 0, v0 = 0, u1 = 1, v1 = 1,
        flipY = false
    ): void {
        // We must wait for frame end to resize.
        if (this._toInstance >= this._maxBatchSize) {
            this._needsResize = true;
            return;
        }

        this._drawingMesh.writeSprite(this._toInstance, position, size, color, u0, v0, u1, v1, flipY);

        // Write at correct position.
        this._toInstance++;
    }

    /** Draws the mesh */
    public draw(): void {
        // Nothing to draw.
        if (this._toInstance <= 0 || this._fromInstance > this._toInstance) {
            return;
        }

        // Clamp instance to max batch size.
        if (this._toInstance >= this._maxBatchSize) {
            this._toInstance = this._maxBatchSize - 1;
        }

        // Draw mesh.
        const indicesOffset = this._fromInstance * 6;
        const indicesCount = this._toInstance * 6 - indicesOffset;
        this._drawingMesh.applyChanges();
        this._renderPipeline.render(
            this._drawingMesh.vertexBuffer!,
            this._drawingMesh.indexBuffer!,
            indicesCount,
            indicesOffset);
        this._fromInstance = this._toInstance;
    }

    /**
     * Call on frame end to handle any potential resize request.
     */
    public frameEnd(): void {
        if (this._needsResize) {
            this._maxBatchSize *= 2;
            this._drawingMesh.resize(this._maxBatchSize);
        }

        this._needsResize = false;
    }

    /** @inheritDoc */
    public dispose(): void {
        this._renderPipeline.dispose();
        this._drawingMesh.dispose();
    }
}
