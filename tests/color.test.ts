import { describe, expect, it } from "vitest";
import { Color } from "../src/index.ts";

describe("Color", () => {
    it("stores channels and defaults alpha to 1", () => {
        const color = new Color(0.2, 0.4, 0.6);

        expect(color.r).toBe(0.2);
        expect(color.g).toBe(0.4);
        expect(color.b).toBe(0.6);
        expect(color.a).toBe(1);
        expect([...color]).toEqual([0.2, 0.4, 0.6, 1]);

        color.r = 0;
        color.g = 1;
        color.b = 0.5;
        color.a = 0.25;

        expect([...color]).toEqual([0, 1, 0.5, 0.25]);
    });

    it("copies channels with set and compares all four", () => {
        const color = new Color(0, 0, 0, 0);
        const other = new Color(0.1, 0.2, 0.3, 0.4);

        color.set(other);

        expect(color.equals(other)).toBe(true);
        expect(color.equals(new Color(0.1, 0.2, 0.3, 1))).toBe(false);
        expect(color.equals(new Color(0.1, 0.2, 0, 0.4))).toBe(false);

        other.r = 1;
        expect(color.r).toBe(0.1);
    });

    it("copies channels into new vectors", () => {
        const color = new Color(0.2, 0.4, 0.6, 0.8);
        const xyzw = color.toVector4();
        const xyz = color.toVector3();

        color.r = 1;
        color.a = 0;

        expect(xyzw[0]).toBeCloseTo(0.2, 5);
        expect(xyzw[1]).toBeCloseTo(0.4, 5);
        expect(xyzw[2]).toBeCloseTo(0.6, 5);
        expect(xyzw[3]).toBeCloseTo(0.8, 5);
        expect(xyz[0]).toBeCloseTo(0.2, 5);
        expect(xyz[1]).toBeCloseTo(0.4, 5);
        expect(xyz[2]).toBeCloseTo(0.6, 5);
    });

    it("builds the named colors with opaque alpha", () => {
        expect([...Color.black()]).toEqual([0, 0, 0, 1]);
        expect([...Color.white()]).toEqual([1, 1, 1, 1]);
        expect([...Color.red()]).toEqual([1, 0, 0, 1]);
        expect([...Color.green()]).toEqual([0, 1, 0, 1]);
        expect([...Color.blue()]).toEqual([0, 0, 1, 1]);
        expect([...Color.gray()]).toEqual([0.5, 0.5, 0.5, 1]);
        expect([...Color.yellow()]).toEqual([1, 1, 0, 1]);
        expect([...Color.lightPink()]).toEqual([1, 0.71, 0.76, 1]);
        expect([...Color.wheat()]).toEqual([0.96, 0.87, 0.7, 1]);
        expect([...Color.whiteSmoke()]).toEqual([0.96, 0.96, 0.96, 1]);
        expect([...Color.slateGray()]).toEqual([0.439, 0.502, 0.565, 1]);
        expect([...Color.cornerFlowerBlue()]).toEqual([0.39, 0.58, 0.93, 1]);
        expect([...Color.orange()]).toEqual([1, 0.647, 0, 1]);
        expect(Color.white()).not.toBe(Color.white());
    });
});
