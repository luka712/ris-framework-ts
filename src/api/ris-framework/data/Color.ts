import { vec3, vec4 } from 'gl-matrix';

/**
 * The color.
 */
export class Color implements Iterable<number>{

    private _colors = [0,0,0,0];

    /**
     * Create a new color.
     * @param r - The red value.
     * @param g - The green value.
     * @param b - The blue value.
     * @param a - The alpha value. By default, it is 1.0.
     */
    public constructor(
         r: number,
         g: number,
         b: number,
         a = 1) {

        this._colors[0] = r;
        this._colors[1] = g;
        this._colors[2] = b;
        this._colors[3] = a;
    }

    [Symbol.iterator](): Iterator<number, any, any> {
        return this._colors[Symbol.iterator]();
    }

    /**
     * The red color.
     */
    public get r() : number {
        return this._colors[0];
    }

    public set r(value: number) {
        this._colors[0] = value;
    }

    /**
     * The green color.
     */
    public get g() : number {
        return this._colors[1];
    }

    public set g(value: number) {
        this._colors[1] = value;
    }

    /**
     * The green color.
     */
    public get b() : number {
        return this._colors[2];
    }

    public set b(value: number) {
        this._colors[2] = value;
    }

    /**
     * The alpha.
     */
    public get a() : number {
        return this._colors[3];
    }

    public set a(value: number) {
        this._colors[3] = value;
    }

    /**
     * Returns the Black color.
     */
    public static black(): Color {
        return new Color(0, 0, 0);
    }

    /**
     * Returns the White color.
     */
    public static white(): Color {
        return new Color(1, 1, 1);
    }

    /**
     * Returns the Light Pink color.
     */
    public static lightPink(): Color {
        return new Color(1.0, 0.71, 0.76);
    }

    /**
     * Returns the Red color.
     */
    public static red(): Color {
        return new Color(1, 0, 0);
    }

    /**
     * Returns the Green color.
     */
    public static green(): Color {
        return new Color(0, 1, 0);
    }

    /**
     * Returns the Blue color.
     */
    public static blue(): Color {
        return new Color(0, 0, 1);
    }

    /**
     * Returns the Gray color.
     */
    public static gray(): Color {
        return new Color(0.5, 0.5, 0.5);
    }

    /**
     * Returns the Yellow color.
     */
    public static yellow(): Color {
        return new Color(1, 1, 0);
    }

    /**
     * Returns the Wheat color.
     */
    public static wheat(): Color {
        return new Color(0.96, 0.87, 0.7);
    }

    /**
     * Returns the White Smoke color.
     */
    public static whiteSmoke(): Color {
        return new Color(0.96, 0.96, 0.96);
    }

    /**
     * Returns the Slate Gray color.
     */
    public static slateGray(): Color {
        return new Color(0.439, 0.502, 0.565);
    }

    /**
     * Returns the Cornflower Blue color.
     */
    public static cornerFlowerBlue(): Color {
        return new Color(0.39, 0.58, 0.93);
    }

    /**
     * Returns the Orange color.
     */
    public static orange(): Color {
        return new Color(1.0, 0.647, 0.0);
    }

    /**
     * Sets the value of this color to be equal to other color.
     * @param other The other color.
     */
    public set(other: Color): void {
        this.r = other.r;
        this.g = other.g;
        this.b = other.b;
        this.a = other.a;
    }

    /**
     * Are two colors equal.
     * @param other The other color.
     */
    public equals(other: Color): boolean {
        return this.r === other.r &&
            this.g === other.g &&
            this.b === other.b &&
            this.a === other.a && this.b === other.b;
    }

    /**
     * Convert to vector.
     * @returns The vec4.
     */
    public toVector4(): vec4 {
        return vec4.fromValues(this.r, this.g, this.b, this.a);
    }

    /**
     * Convert to vector.
     * @returns The vec3.
     */
    public toVector3(): vec3 {
        return vec3.fromValues(this.r, this.g, this.b);
    }

    /**
     * Linearly interpolate between two colors.
     * @param a - The first color.
     * @param b - The second color.
     * @param t - The time step.
     * @param o - The color that receives value.
     */
    public lerp(a: Color, b: Color, t: number, o: Color) {

        o

    }
}


