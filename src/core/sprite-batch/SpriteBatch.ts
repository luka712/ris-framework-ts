import {type mat4, vec2, vec3} from "gl-matrix";
import {SpriteBatchDrawable} from "./SpriteBatchDrawable";
import {
    type IFramework,
    type ITexture2D,
    type ISpriteBatch,
    type IOrthographicCamera,
    type IUniformBuffer,
    Color, Rect, type ISampler
} from "ris-framework-api";

/**
 * The implementation of sprite batch.
 */
export class SpriteBatch implements ISpriteBatch {
    static MAX_BATCH_SIZE = 1000;
    static ZERO_VECTOR = vec2.fromValues(0, 0);
    static CENTER_VECTOR = vec2.fromValues(0.5, 0.5);

    private readonly _tempPosition = vec3.create();
    private readonly _tempSize = vec2.create();
    private readonly _tempSourceRect = new Rect(0, 0, 0, 0);

    /**
     * The drawables where first key is texture id, second key is sampler id and value is drawable.
     */
    private readonly _spriteBatchDrawables: Map<number, Map<number, SpriteBatchDrawable>> = new Map();
    private _currentTexture: ITexture2D | null = null;
    private _currentSampler: ISampler | null = null;
    private _currentSpriteBatchDrawable: SpriteBatchDrawable = null!;
    private _defaultCamera: IOrthographicCamera = null!;

    // It is set on Begin and reset back to the default camera on End.
    private _currentProjectionViewBuffer: IUniformBuffer = null!;

    /**
     * The default texture to use for "texture less" draw calls.
     * It is white so that color multiplication works correctly.
     */
    private _defaultWhiteTexture: ITexture2D = null!;

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    private _tryGetDrawable(texture: ITexture2D, sampler: ISampler) {
        const samplerKeyValue = this._spriteBatchDrawables.get(texture.id);
        if (!samplerKeyValue) {
            return null;
        }

        return samplerKeyValue.get(sampler.id);
    }

    private _setDrawable(texture: ITexture2D, sampler: ISampler, drawable: SpriteBatchDrawable): void {
        let samplerKeyValue = this._spriteBatchDrawables.get(texture.id);
        if (!samplerKeyValue) {
            samplerKeyValue = new Map();
            samplerKeyValue.set(sampler.id, drawable);
        }

        this._spriteBatchDrawables.set(texture.id, samplerKeyValue);
    }

    private _validateTexture(texture?: ITexture2D) {
        if (!texture) {
            throw new Error(`Texture cannot be empty.`);
        }
    }

    private _checkIfNewDrawableShouldBeCreated(texture: ITexture2D, sampler: ISampler): void {
        // If there was a texture change, we need to end the current sprite batch drawable and start a new one.
        if (texture != this._currentTexture || sampler != this._currentSampler) {
            // End will draw. This draws with a previously set sprite batch drawable.
            this.end();

            this._currentTexture = texture;

            // Create a new sprite batch drawable if needed.
            let spriteBatchDrawable = this._tryGetDrawable(texture, sampler);

            if (!spriteBatchDrawable) {
                spriteBatchDrawable = new SpriteBatchDrawable(
                    this._framework, texture, sampler,
                    this._currentProjectionViewBuffer,
                    SpriteBatch.MAX_BATCH_SIZE);
                spriteBatchDrawable.initialize();

                this._setDrawable(texture, sampler, spriteBatchDrawable);

                // When texture is disposed destroy this drawable.
                const disposeListener = () => {
                    spriteBatchDrawable?.dispose();
                    texture.removeOnDisposedListener(disposeListener);
                };
                texture.addOnDisposedListener(disposeListener);
            }

            // Assign current.
            this._currentSpriteBatchDrawable = spriteBatchDrawable;
        }
    }

    /** @inheritDoc */
    public initialize() {
        this._defaultCamera = this._framework.cameraFactory.createDefaultOrthographicCamera();
        this._currentProjectionViewBuffer = this._defaultCamera.projectionViewBuffer;
        this._defaultWhiteTexture = this._framework.textureFactory.createEmpty(1, 1, Color.white());

        this._framework.renderer.addOnResizedListener((_, size) => {
            this._defaultCamera.right = size[0]
            this._defaultCamera.bottom = size[1];
            this._defaultCamera.updateBuffers();
        });
    }

    /** @inheritDoc */
    public begin(projectionViewMatrix: mat4 | undefined = undefined,
                 sampler: ISampler | undefined = undefined) {
        this.end();

        this._currentSampler = sampler ?? this._framework.graphicsDevice.defaultTextureSampler;

        if (projectionViewMatrix) {
            this._currentProjectionViewBuffer.update(projectionViewMatrix);
        }

        for (const texSamplerDrawableKvp of this._spriteBatchDrawables) {
            for (const samplerDrawableKvp of texSamplerDrawableKvp[1]) {
                samplerDrawableKvp[1].reset();
            }
        }

        // Clear current texture.
        this._currentTexture = null;
    }


    /** @inheritDoc */

    public drawRect(drawRect: Rect, color: Color, __: number = 0, _: vec2 | undefined = undefined) {
        this._checkIfNewDrawableShouldBeCreated(this._defaultWhiteTexture, this._currentSampler!);

        this._tempPosition[0] = drawRect.x;
        this._tempPosition[1] = drawRect.y;
        this._tempPosition[2] = 0;
        this._tempSize[0] = drawRect.width;
        this._tempSize[1] = drawRect.height;

        this._currentSpriteBatchDrawable.writeSprite(
            this._tempPosition, this._tempSize, color
        );
    }

    /** @inheritDoc */
    public draw(texture: ITexture2D,
                drawRect: Rect,
                color: Color,
                sourceRect?: Rect,
                // @ts-ignore
                rotation: number = 0,
                // @ts-ignore
                rotationOrigin?: vec2,
                layerDepth: number = 0): void {

        this._validateTexture(texture);
        this._checkIfNewDrawableShouldBeCreated(texture, this._currentSampler!);

        // Safe to assign current texture.
        this._currentTexture = texture;

        if (!sourceRect) {
            sourceRect = this._tempSourceRect;
            sourceRect.x = 0;
            sourceRect.y = 0;
            sourceRect.width = texture.width;
            sourceRect.height = texture.height;
        }

        const u0 = sourceRect.x / texture.width;
        const v0 = sourceRect.y / texture.height;
        const u1 = (sourceRect.x + sourceRect.width) / texture.width;
        const v1 = (sourceRect.y + sourceRect.height) / texture.height;

        this._tempPosition[0] = drawRect.x;
        this._tempPosition[1] = drawRect.y;
        this._tempPosition[2] = layerDepth;
        this._tempSize[0] = drawRect.width;
        this._tempSize[1] = drawRect.height;

        this._currentSpriteBatchDrawable.writeSprite(
            this._tempPosition, this._tempSize,
            color,
            u0, v0, u1, v1
        );
    }

    /** @inheritDoc */
    public end(): void {
        if (this._currentTexture != null) {
            this._currentSpriteBatchDrawable.draw();
        }
    }

    /** @inheritDoc */
    public frameEnd(): void {
        for (const texSamplerDrawableKvp of this._spriteBatchDrawables) {
            for (const samplerDrawableKvp of texSamplerDrawableKvp[1]) {
                samplerDrawableKvp[1].frameEnd();
            }
        }
    }
}