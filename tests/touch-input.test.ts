import { describe, expect, it } from "vitest";
import { vec2 } from "gl-matrix";
import {
    GestureCollection,
    GestureSample,
    GestureType,
    PointerState,
    PointerStateCollection,
    PointerType,
    TouchCollection,
    TouchLocation,
    TouchLocationState,
    TouchPanelCapabilities,
} from "../src/index.ts";

function touch(options: {
    id: number;
    state: TouchLocationState;
    x?: number;
    y?: number;
    dx?: number;
    dy?: number;
    pressure?: number;
    previous?: TouchLocation;
}): TouchLocation {
    return new TouchLocation(
        options.id,
        options.state,
        vec2.fromValues(options.x ?? 0, options.y ?? 0),
        vec2.fromValues(options.dx ?? 0, options.dy ?? 0),
        options.pressure ?? 0,
        options.previous,
    );
}

describe("TouchLocation", () => {
    it("is a touch pointer and derives isDown from the location state", () => {
        const pressed = touch({
            id: 4,
            state: TouchLocationState.PRESSED,
            x: 10,
            y: 20,
            dx: 1,
            dy: -2,
            pressure: 0.75,
        });

        expect(pressed).toBeInstanceOf(PointerState);
        expect(pressed.id).toBe(4);
        expect(pressed.pointerId).toBe(4);
        expect(pressed.pointerType).toBe(PointerType.TOUCH);
        expect(pressed.x).toBe(10);
        expect(pressed.y).toBe(20);
        expect(pressed.dX).toBe(1);
        expect(pressed.dY).toBe(-2);
        expect(pressed.pressure).toBe(0.75);
        expect(pressed.isPressed()).toBe(true);
        expect(pressed.isMoved()).toBe(false);
        expect(pressed.isReleased()).toBe(false);
        expect(pressed.isDown).toBe(true);
        expect(pressed.tryGetPreviousLocation()).toBeUndefined();

        const moved = touch({ id: 4, state: TouchLocationState.MOVED, previous: pressed });
        expect(moved.isMoved()).toBe(true);
        expect(moved.isDown).toBe(true);
        expect(moved.tryGetPreviousLocation()).toBe(pressed);

        const released = touch({ id: 4, state: TouchLocationState.RELEASED, previous: moved });
        expect(released.isReleased()).toBe(true);
        expect(released.isPressed()).toBe(false);
        expect(released.isDown).toBe(false);
        expect(released.tryGetPreviousLocation()).toBe(moved);

        const invalid = touch({ id: 0, state: TouchLocationState.INVALID });
        expect(invalid.isPressed()).toBe(false);
        expect(invalid.isMoved()).toBe(false);
        expect(invalid.isReleased()).toBe(false);
        expect(invalid.isDown).toBe(false);
    });
});

describe("TouchCollection", () => {
    it("counts active contacts and treats a missing id as up", () => {
        const pressed = touch({ id: 1, state: TouchLocationState.PRESSED, x: 3, y: 4 });
        const moved = touch({ id: 2, state: TouchLocationState.MOVED });
        const released = touch({ id: 3, state: TouchLocationState.RELEASED });
        const duplicate = touch({ id: 1, state: TouchLocationState.MOVED, x: 9, y: 9 });
        const collection = new TouchCollection([pressed, moved, released, duplicate]);

        expect(collection.count).toBe(4);
        expect(collection.activeCount).toBe(3);
        expect(collection.touches[0]).toBe(pressed);

        expect(collection.findById(1)).toBe(pressed);
        expect(collection.findById(3)).toBe(released);
        expect(collection.findById(99)).toBeUndefined();

        expect(collection.isDown(1)).toBe(true);
        expect(collection.isDown(2)).toBe(true);
        expect(collection.isDown(3)).toBe(false);
        expect(collection.isDown(99)).toBe(false);
        expect(collection.isReleased(3)).toBe(true);
        expect(collection.isReleased(1)).toBe(false);
        expect(collection.isReleased(99)).toBe(false);
    });

    it("shares touch locations with the pointer collection and skips other pointers", () => {
        const finger = touch({ id: 7, state: TouchLocationState.MOVED, x: 8, y: 12, dx: 2, dy: 3 });
        const plainTouch = new PointerState(
            8,
            PointerType.TOUCH,
            vec2.fromValues(1, 1),
            vec2.fromValues(0, 0),
        );
        plainTouch.isDown = true;
        const mouse = new PointerState(
            1,
            PointerType.MOUSE,
            vec2.fromValues(0, 0),
            vec2.fromValues(0, 0),
        );
        const pen = new PointerState(
            2,
            PointerType.PEN,
            vec2.fromValues(5, 5),
            vec2.fromValues(0, 0),
        );
        const pointers = new PointerStateCollection([mouse, finger, plainTouch, pen]);
        const touches = TouchCollection.fromPointerStates(pointers);

        expect(touches.count).toBe(1);
        expect(touches.activeCount).toBe(1);
        expect(touches.findById(7)).toBe(finger);
        expect(touches.findById(8)).toBeUndefined();
        expect(pointers.pointerStates[1]).toBe(finger);
        expect(finger.x).toBe(8);
        expect(finger.dY).toBe(3);
    });

    it("is empty when no touch locations were reported", () => {
        const collection = new TouchCollection([]);

        expect(collection.count).toBe(0);
        expect(collection.activeCount).toBe(0);
        expect(collection.findById(1)).toBeUndefined();
        expect(collection.isDown(1)).toBe(false);
        expect(collection.isReleased(1)).toBe(false);
        expect(TouchCollection.fromPointerStates(new PointerStateCollection([])).count).toBe(0);
    });
});

describe("TouchPanelCapabilities", () => {
    it("describes a connected panel and a panel with no touch support", () => {
        const connected = new TouchPanelCapabilities(true, 10, true);
        expect(connected.isConnected).toBe(true);
        expect(connected.maximumTouchCount).toBe(10);
        expect(connected.hasPressure).toBe(true);

        const none = new TouchPanelCapabilities(false, 0, false);
        expect(none.isConnected).toBe(false);
        expect(none.maximumTouchCount).toBe(0);
        expect(none.hasPressure).toBe(false);
    });
});

describe("GestureSample", () => {
    it("exposes both contacts and marks only pinch gestures as multi-point", () => {
        const position = vec2.fromValues(4, 6);
        const delta = vec2.fromValues(1, -1);
        const position2 = vec2.fromValues(40, 60);
        const delta2 = vec2.fromValues(-3, 2);
        const pinch = new GestureSample(GestureType.PINCH, position, delta, position2, delta2);

        expect(pinch.x).toBe(4);
        expect(pinch.y).toBe(6);
        expect(pinch.dX).toBe(1);
        expect(pinch.dY).toBe(-1);
        expect(pinch.x2).toBe(40);
        expect(pinch.y2).toBe(60);
        expect(pinch.dX2).toBe(-3);
        expect(pinch.dY2).toBe(2);
        expect(pinch.position).toBe(position);
        expect(pinch.delta2).toBe(delta2);
        expect(pinch.isMultiPoint).toBe(true);

        const pinchComplete = new GestureSample(
            GestureType.PINCH_COMPLETE,
            vec2.create(),
            vec2.create(),
            vec2.create(),
            vec2.create(),
        );
        expect(pinchComplete.isMultiPoint).toBe(true);

        const tap = new GestureSample(GestureType.TAP, position, delta, position2, delta2);
        expect(tap.isMultiPoint).toBe(false);
        expect(tap.x2).toBe(40);
    });
});

describe("GestureCollection", () => {
    it("filters samples by type", () => {
        const tap = new GestureSample(
            GestureType.TAP,
            vec2.fromValues(1, 2),
            vec2.create(),
            vec2.create(),
            vec2.create(),
        );
        const pinch = new GestureSample(
            GestureType.PINCH,
            vec2.create(),
            vec2.create(),
            vec2.fromValues(3, 4),
            vec2.create(),
        );
        const collection = new GestureCollection([tap, pinch]);

        expect(collection.count).toBe(2);
        expect(collection.ofType(GestureType.TAP)).toEqual([tap]);
        expect(collection.ofType(GestureType.FLICK)).toEqual([]);
        expect(new GestureCollection([]).count).toBe(0);
    });

    it("tests combined gesture flags and treats none as an empty set", () => {
        const enabled = GestureType.TAP | GestureType.PINCH | GestureType.HOLD;

        expect(GestureCollection.isEnabled(enabled, GestureType.TAP)).toBe(true);
        expect(GestureCollection.isEnabled(enabled, GestureType.PINCH)).toBe(true);
        expect(GestureCollection.isEnabled(enabled, GestureType.TAP | GestureType.HOLD)).toBe(true);
        expect(GestureCollection.isEnabled(enabled, GestureType.FLICK)).toBe(false);
        expect(GestureCollection.isEnabled(enabled, GestureType.TAP | GestureType.FLICK)).toBe(false);
        expect(GestureCollection.isEnabled(enabled, GestureType.NONE)).toBe(false);

        expect(GestureCollection.isEnabled(GestureType.NONE, GestureType.NONE)).toBe(true);
        expect(GestureCollection.isEnabled(GestureType.NONE, GestureType.TAP)).toBe(false);
        expect(GestureCollection.isEnabled(GestureType.TAP, GestureType.NONE)).toBe(false);
    });
});
