import {ITexture2D} from "../rendering/texture/ITexture2D";
import {Rect} from "../data/Rect";
import {Color} from "../data/Color";
import {vec2, mat4} from "gl-matrix"
import {IUniformBuffer} from "../rendering/buffers/IUniformBuffer";
import {ISampler} from "../rendering/sampler/ISampler";

/**
 * The sprite batch.
 */
export interface ISpriteBatch {

    /**
     * Initializes the sprite batch.
     * This method is called internally by the framework.
     */
    initialize(): void;

    /**
     * Begins the sprite batch.
     * @param projectionViewMatrix - The projection view matrix to use for rendering between Begin and End.
     */
    begin(projectionViewMatrix?: mat4, textureSampler?: ISampler): void;

    /**
     * Draws the un-textured rectangle.
     * @param drawRect The rectangle.
     * @param color The color.
     * @param rotation The rotation of rectangle.
     * @param rotationOrigin The rotation origin.
     */
    drawRect(drawRect: Rect, color: Color, rotation?: number, rotationOrigin?: vec2): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param drawRect - The draw rectangle.
     * @param color - The color.
     * @param sourceRect - The source rectangle that selects part of the texture to draw.
     * @param rotation - The rotation of a sprite in clockwise order.
     * @param rotationOrigin - The origin for a rotation.
     * @param layerDepth - The layer depth. By default, it is 0.
     */
    draw(texture: ITexture2D,
         drawRect: Rect,
         color: Color,
         sourceRect?: Rect,
         rotation?: number,
         rotationOrigin?: vec2,
         layerDepth?: number): void;


    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param position - The position of a sprite.
     * @param size - The size of a sprite.
     */
    // draw(texture: ITexture2D, position: vec2, size: vec2): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param drawRect - The draw rectangle.
     * @param color - The color.
     */
    // draw(texture: ITexture2D, drawRect: Rect, color: Color): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param drawRect - The draw rectangle.
     * @param sourceRect - The source rectangle that selects part of the texture to draw.
     * @param color - The color.
     */
    //draw(texture: ITexture2D, drawRect: Rect, sourceRect: Rect, color: Color): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param drawRect - The draw rectangle.
     * @param sourceRect - The source rectangle that selects part of the texture to draw.
     * @param color - The color.
     * @param rotation - The rotation of a sprite in clockwise order.
     */
    // draw(texture: ITexture2D, drawRect: Rect, sourceRect: Rect, color: Color, rotation: number): void;

    /**
     * Draws the empty rectangle shape of a given color.
     * @param drawRect - The draw rectangle.
     * @param color - The color.
     * @param origin - The origin of a sprite.
     * @param rotation - The rotation of a sprite in clockwise order.
     * @param rotationOrigin - The origin for a rotation.
     If null by default, it is set to (0,0) or top left corner.
     */
    //  draw(drawRect: Rect, color: Color, origin: vec2, rotation: number, rotationOrigin?: number): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param drawRect - The draw rectangle.
     * @param sourceRect - The source rectangle that selects part of texture to draw.
     * @param color - The color.
     * @param origin - The origin of a sprite.
     * @param rotation - The rotation of a sprite in clockwise order.
     * @param rotationOrigin - The origin for a rotation.
     * @param layerDepth - The layer depth. By default, it is 0.
     */
    //draw(texture: ITexture2D, drawRect: Rect, sourceRect: Rect, color: Color, origin: vec2, rotation: number, rotationOrigin: vec2, layerDepth: number): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param position - The position.
     * @param sourceRect - The source rectangle that selects part of texture to draw.
     * @param color - The color.
     * @param rotation - The rotation of a sprite in clockwise order.
     * @param origin - The origin of a sprite.
     * @param scale - The scale of a sprite.
     * @param flipSpriteHorizontally - Flip sprite horizontally. By default, it is false.
     * @param flipSpriteVertically - Flip sprite vertically. By default, it is false.
     */
    //draw(texture: ITexture2D, position: vec2, sourceRect: Rect, color: Color, rotation: number, origin: vec2, scale: vec2, flipSpriteHorizontally: boolean, flipSpriteVertically: boolean): void;

    /**
     * Draws a sprite.
     * @param texture - The texture to draw.
     * @param sourceRect - The source rectangle that selects part of texture to draw.
     * @param position - The position of a sprite.
     * @param size - The size of a sprite.
     */

    // draw(texture: ITexture2D, sourceRect: Rect, position: vec2, size: vec2): void;

    /**
     * Ends the sprite batch.
     */
    end(): void;

    /**
     * Called internally by framework on end of frame.
     */
    frameEnd(): void;
}
