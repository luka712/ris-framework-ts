import { describe, expect, it } from "vitest";
import { vec2 } from "gl-matrix";
import { MathHelper } from "../src/api/index.ts";

describe("MathHelper", () => {
    it("converts between degrees and radians", () => {
        expect(MathHelper.HALF_PI).toBeCloseTo(Math.PI / 2, 12);
        expect(MathHelper.toRadians(0)).toBe(0);
        expect(MathHelper.toRadians(180)).toBeCloseTo(Math.PI, 12);
        expect(MathHelper.toRadians(-180)).toBeCloseTo(-Math.PI, 12);
        expect(MathHelper.toRadians(360)).toBeCloseTo(Math.PI * 2, 12);
        expect(MathHelper.toDegrees(0)).toBe(0);
        expect(MathHelper.toDegrees(Math.PI)).toBeCloseTo(180, 12);
        expect(MathHelper.toDegrees(MathHelper.HALF_PI)).toBeCloseTo(90, 12);
        expect(MathHelper.toDegrees(MathHelper.toRadians(-45))).toBeCloseTo(-45, 12);
    });

    it("maps a value from one range onto another", () => {
        expect(MathHelper.map(0, 0, 10, 0, 1)).toBe(0);
        expect(MathHelper.map(10, 0, 10, 0, 1)).toBe(1);
        expect(MathHelper.map(5, 0, 10, 0, 1)).toBe(0.5);
        expect(MathHelper.map(0, 0, 10, 5, 15)).toBe(5);
        expect(MathHelper.map(10, 0, 10, 5, 15)).toBe(15);
        expect(MathHelper.map(5, 0, 10, 100, 0)).toBe(50);
        expect(MathHelper.map(15, 0, 10, 0, 1)).toBe(1.5);

        const distance = 3;
        const near = 0.01;
        const far = 100;
        expect(MathHelper.map(distance, near, far, 1, 0.1)).toBeCloseTo(0.9730873087308731, 12);
    });

    it("clamps to inclusive bounds", () => {
        expect(MathHelper.clamp(5, 0, 10)).toBe(5);
        expect(MathHelper.clamp(-1, 0, 10)).toBe(0);
        expect(MathHelper.clamp(11, 0, 10)).toBe(10);
        expect(MathHelper.clamp(0, 0, 10)).toBe(0);
        expect(MathHelper.clamp(10, 0, 10)).toBe(10);
        expect(MathHelper.clamp(1, 1, 1)).toBe(1);
    });

    it("throws from the unimplemented instance helpers", () => {
        const helper = new MathHelper();
        const origin = vec2.fromValues(0, 0);
        const calls = [
            () => helper.pitchToPolar(0),
            () => helper.yawToAzimuth(0),
            () => helper.polarToPitch(0),
            () => helper.azimuthToYaw(0),
            () => helper.smoothStep(0.5),
            () => helper.alignBytes(16, 4),
            () => helper.max(1, 2),
            () => helper.min(1, 2),
            () => helper.circleIntersectsCircle(origin, 1, origin, 1),
            () => helper.dot(origin, origin),
            () => helper.reflect(origin, origin),
            () => helper.angleToVector(0),
            () => helper.randomBinomial(),
            () => helper.vector2DFromAngle(0),
            () => helper.pow(2, 3),
            () => helper.rotatePoint(origin, origin, 0),
        ];

        for (const call of calls) {
            expect(call).toThrow("Not implemented");
        }
    });
});
