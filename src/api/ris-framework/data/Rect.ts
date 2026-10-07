import {vec2} from "gl-matrix";

/**
 * The rectangle.
 */
export class Rect {

    /**
     * The rectangle constructor.
     * @param x - The position x.
     * @param y - The position y.
     * @param width - The width of a rectangle.
     * @param height - The height of a rectangle.
     */
    public constructor(public x: number,
                       public y: number,
                       public width: number,
                       public height: number) {
    }

    /**
     * The left side of a rectangle.
     */
    public get left(): number {
        return this.x;
    }

    /**
     * The top side of a rectangle.
     */
    public get top(): number {
        return this.y;
    }

    /**
     * The right side of a rectangle.
     */
    public get right(): number {
        return this.x + this.width;
    }

    /**
     * The bottom side of a rectangle.
     */
    public get bottom(): number {
        return this.y + this.height;
    }

    /**
     * The rectangle contains a point.
     * @param x - The x position of a point.
     * @param y - The y position of a point.
     * @returns True if it contains a point.
     */
    public contains(x: number, y: number): boolean {
        return x >= this.left && x <= this.right
            && y <= this.top && y <= this.bottom;
    }

    /**
     * Check if the rectangle intersects with another rectangle.
     * @param other - The other .
     * @returns true if there is intersection, false otherwise.
     */
    public intersects(other: Rect): boolean {
        return this.left < other.right && this.right > other.left
        && this.top < other.bottom && this.bottom > other.top;
    }

    /**
     * Offsets the position of a rectangle.
     * @param x - The x position.
     * @param y - The y position.
     */
    public offset(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Creates a new instance of this rect.
     * @param x The x position.
     * @param y The y position.
     * @param width The width.
     * @param height The height.
     */
    public clone(x?: number, y?: number, width?: number, height?: number): Rect {
        return new Rect(this.x ?? 0, this.y ?? 0, this.width ?? 0, this.height ?? 0);
    }
}
