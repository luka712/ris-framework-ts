import { describe, expect, it } from "vitest";
import { Rect } from "../src/index.ts";

describe("Rect", () => {
    it("derives the edges from position and size", () => {
        const rect = new Rect(1, 2, 3, 4);

        expect(rect.left).toBe(1);
        expect(rect.top).toBe(2);
        expect(rect.right).toBe(4);
        expect(rect.bottom).toBe(6);
    });

    it("contains a point when x is inside the span and y is at most both horizontal edges", () => {
        const rect = new Rect(1, 2, 3, 4);

        expect(rect.contains(1, 2)).toBe(true);
        expect(rect.contains(4, 2)).toBe(true);
        expect(rect.contains(1, 1)).toBe(true);
        expect(rect.contains(1, 3)).toBe(false);
        expect(rect.contains(4, 6)).toBe(false);
        expect(rect.contains(5, 2)).toBe(false);
        expect(rect.contains(0, 2)).toBe(false);
    });

    it("intersects another rectangle on a strict overlap", () => {
        const rect = new Rect(0, 0, 10, 10);

        expect(rect.intersects(new Rect(9, -1, 2, 2))).toBe(true);
        expect(rect.intersects(new Rect(10, 0, 5, 5))).toBe(false);
        expect(rect.intersects(new Rect(0, 10, 5, 5))).toBe(false);
        expect(rect.intersects(new Rect(-5, -5, 4, 4))).toBe(false);
    });

    it("replaces the position when offset", () => {
        const rect = new Rect(1, 2, 3, 4);

        rect.offset(5, 6);

        expect(rect.x).toBe(5);
        expect(rect.y).toBe(6);
        expect(rect.width).toBe(3);
        expect(rect.height).toBe(4);
        expect(rect.right).toBe(8);
        expect(rect.bottom).toBe(10);
    });

    it("clones the current rectangle and ignores the clone arguments", () => {
        const rect = new Rect(1, 2, 3, 4);
        const copy = rect.clone(9, 9, 9, 9);

        expect(copy).not.toBe(rect);
        expect(copy.x).toBe(1);
        expect(copy.y).toBe(2);
        expect(copy.width).toBe(3);
        expect(copy.height).toBe(4);

        rect.x = 8;
        expect(copy.x).toBe(1);
    });
});
