import {vec2} from "gl-matrix";

/**
 * The math helper class.
 * Provides math functions and constants.
 */
export class MathHelper {

    /**
     * The value of half PI.
     */
    public static readonly HALF_PI = Math.PI * 0.5;

    /**
     * Convert degrees to radians.
     * @param degrees - The degrees.
     * @returns The radians.
     */
    public static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Convert radians to degrees.
     * @param radians - The radians.
     * @returns The degrees.
     */
    public  static toDegrees(radians: number): number {
        return radians * (180 / Math.PI);
    }

    /**
     * Convert pitch to polar angle.
     * Pitch is used in Aircraft coordinates to represent the up and down movement.
     * Polar is used in spherical coordinates to represent the up and down movement.
     * @param pitch - The pitch angle.
     * @returns The polar angle.
     */
    public pitchToPolar(pitch: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Convert azimuth to yaw.
     *
     * Azimuth is used in spherical coordinates to represent the left and right movement.
     *
     * Yam is used in Aircraft coordinates to represent the left and right movement.
     * @param yaw - The yaw angle.
     * @returns The azimuth angle.
     */
    public yawToAzimuth(yaw: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Convert polar to pitch angle.
     * Polar is used in spherical coordinates to represent the up and down movement.
     * Pitch is used in Aircraft coordinates to represent the up and down movement.
     * @param polar - The polar angle.
     * @returns The pitch angle.
     */
    public polarToPitch(polar: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Convert azimuth to yaw angle.
     *
     * Yam is used in Aircraft coordinates to represent the left and right movement.
     *
     * Azimuth is used in spherical coordinates to represent the left and right movement.
     * @param azimuth - The azimuth angle.
     * @returns The yaw angle.
     */
    public azimuthToYaw(azimuth: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Create a smooth step for the given value.
     * Value should be in range [0, 1].
     * @param x - The x value.
     * @returns The smoothed value.
     */
    public smoothStep(x: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Map the value from one range to another.
     * @param value - The value to map.
     * @param fromMin - From minimum.
     * @param fromMax - From maximum.
     * @param toMin - To minimum.
     * @param toMax - To maximum.
     * @returns The mapped value.
     */
    public static map(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
        return (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
    }

    /**
     * Align the bytes to the given alignment.
     * @param value - The value.
     * @param alignment - The alignment.
     * @returns The aligned bytes.
     */
    public alignBytes(value: number, alignment: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Clamp the value between the given range.
     * @param value - The value to clamp.
     * @param lowerLimit - The lower value.
     * @param upperLimit - The upper limit.
     * @returns The clamped value.
     */
    public static clamp(value: number, lowerLimit: number, upperLimit: number): number {
        if(value < lowerLimit){
            return lowerLimit;
        }
        if(value > upperLimit){
            return upperLimit;
        }

        return value;
    }

    /**
     * Return the maximum value between the two values.
     * @param a - The first value.
     * @param b - The second value.
     * @returns The maximum value.
     */
    public max(a: number, b: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Return the minimum value between the two values.
     * @param a - The first value.
     * @param b - The second value.
     * @returns The minimum value.
     */
    public min(a: number, b: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Checks if circle intersects with another circle.
     * @param p1 - The point origin of first circle.
     * @param r1 - The radius of first circle.
     * @param p2 - The point origin of second circle.
     * @param r2 - The radius of second circle.
     * @returns
     */
    public circleIntersectsCircle(p1: vec2, r1: number, p2: vec2, r2: number): boolean {
        throw new Error('Not implemented');
    }

    /**
     * The dot product of two vectors.
     * @param v1 - The first vector.
     * @param v2 - The second vector.
     * @returns The dot product.
     */
    public dot(v1: vec2, v2: vec2): number {
        throw new Error('Not implemented');
    }

    /**
     * Reflect the vector off the normal.
     * @param v - The vector to reflect.
     * @param n - The normal vector.
     * @returns The reflected vector.
     */
    public reflect(v: vec2, n: vec2): vec2 {
        throw new Error('Not implemented');
    }

    /**
     * Convert angle to vector.
     * @param angle - The angle in radians.
     * @returns The vector.
     */
    public angleToVector(angle: number): vec2 {
        throw new Error('Not implemented');
    }

    /**
     * Creates a random float value between -1 and 1
     * where values are more likely to be closer to 0.
     * @returns The random value.
     */
    public randomBinomial(): number {
        throw new Error('Not implemented');
    }

    /**
     * Create a vector from an angle.
     * @param angle - The angle.
     * @returns The  of .
     */
    public vector2DFromAngle(angle: number): vec2 {
        throw new Error('Not implemented');
    }

    /**
     * Raises a number to a power.
     * @param baseValue - The base
     * @param exponent - The exponent
     * @returns baseValue raised to exponent
     */
    public pow(baseValue: number, exponent: number): number {
        throw new Error('Not implemented');
    }

    /**
     * Rotates a point around a center by a given angle.
     * @param point - The point.
     * @param center - The center.
     * @param angle - The angle
     * @returns Rotated vector.
     */
    public rotatePoint(point: vec2, center: vec2, angle: number): vec2 {
        throw new Error('Not implemented');
    }
}
