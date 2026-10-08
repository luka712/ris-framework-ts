import { describe, expect, it } from "vitest";
import { vec2 } from "gl-matrix";
import {
    Button,
    GamePadState,
    Key,
    KeyboardState,
    MouseButton,
    MouseState,
} from "../src/api/index.ts";

describe("KeyboardState", () => {
    it("reports held and released keys from the frame maps", () => {
        const state = new KeyboardState(
            { [Key.A]: true, [Key.SPACE]: false },
            { [Key.D]: true, [Key.A]: false },
        );

        expect(state.isKeyDown(Key.A)).toBe(true);
        expect(state.isKeyUp(Key.A)).toBe(false);
        expect(state.isKeyReleased(Key.A)).toBe(false);

        expect(state.isKeyDown(Key.SPACE)).toBe(false);
        expect(state.isKeyUp(Key.SPACE)).toBe(true);

        expect(state.isKeyDown(Key.W)).toBeUndefined();
        expect(state.isKeyUp(Key.W)).toBe(true);
        expect(state.isKeyReleased(Key.W)).toBeUndefined();
        expect(state.isKeyReleased(Key.D)).toBe(true);
    });
});

describe("MouseState", () => {
    it("exposes position, delta, scroll, and button edges", () => {
        const state = new MouseState(
            { [MouseButton.LEFT]: true },
            { [MouseButton.RIGHT]: true },
            vec2.fromValues(12, 34),
            vec2.fromValues(-2, 5),
            vec2.fromValues(0, -1),
        );

        expect(state.x).toBe(12);
        expect(state.y).toBe(34);
        expect(state.dX).toBe(-2);
        expect(state.dY).toBe(5);
        expect(Array.from(state.scrollWheelPosition)).toEqual([0, -1]);

        expect(state.isButtonDown(MouseButton.LEFT)).toBe(true);
        expect(state.isButtonUp(MouseButton.LEFT)).toBe(false);
        expect(state.isButtonDown(MouseButton.MIDDLE)).toBeUndefined();
        expect(state.isButtonUp(MouseButton.MIDDLE)).toBe(true);
        expect(state.isButtonReleased(MouseButton.RIGHT)).toBe(true);
        expect(state.isButtonReleased(MouseButton.LEFT)).toBeUndefined();
    });
});

describe("GamePadState", () => {
    it("keeps the thumbstick vectors and treats missing buttons as up", () => {
        const left = vec2.fromValues(0.5, -0.25);
        const right = vec2.fromValues(-1, 0.75);
        const state = new GamePadState(
            true,
            { [Button.A]: true },
            { [Button.B]: true },
            left,
            right,
        );

        expect(state.isConnected).toBe(true);
        expect(state.thumbSticks.left).toBe(left);
        expect(state.thumbSticks.right).toBe(right);
        expect(state.isButtonDown(Button.A)).toBe(true);
        expect(state.isButtonUp(Button.A)).toBe(false);
        expect(state.isButtonReleased(Button.A)).toBe(false);
        expect(state.isButtonReleased(Button.B)).toBe(true);
        expect(state.isButtonDown(Button.X)).toBe(false);
        expect(state.isButtonUp(Button.X)).toBe(true);
        expect(state.isButtonReleased(Button.X)).toBe(false);
    });

    it("can represent a disconnected pad", () => {
        const state = new GamePadState(
            false,
            {},
            {},
            vec2.create(),
            vec2.create(),
        );

        expect(state.isConnected).toBe(false);
        expect(state.isButtonDown(Button.START)).toBe(false);
    });
});
