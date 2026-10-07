import { describe, expect, it } from "vitest";
import {
    TouchCollection,
    TouchLocation,
    TouchLocationState,
    TouchPanelCapabilities,
} from "../src/api/index.ts";

describe("TouchLocation", () => {
    it("keeps position, delta, and the previous sample on the same instances", () => {
        const location = new TouchLocation();
        const position = location.position;
        const delta = location.delta;

        location.write(4, TouchLocationState.PRESSED, 10, 20, 0.25);
        expect(location.position).toBe(position);
        expect(location.delta).toBe(delta);
        expect(location.id).toBe(4);
        expect(location.state).toBe(TouchLocationState.PRESSED);
        expect(location.pressure).toBe(0.25);
        expect(location.x).toBe(10);
        expect(location.y).toBe(20);
        expect(location.dX).toBe(0);
        expect(location.dY).toBe(0);
        expect(location.isPressed()).toBe(true);
        expect(location.isMoved()).toBe(false);
        expect(location.isReleased()).toBe(false);
        expect(location.isDown).toBe(true);
        expect(location.tryGetPreviousLocation()).toBeUndefined();

        location.write(4, TouchLocationState.MOVED, 12, 17, 0.75);
        location.writePrevious(TouchLocationState.PRESSED, 10, 20, 0.25);
        const previous = location.tryGetPreviousLocation();

        expect(previous).toBeDefined();
        expect(location.tryGetPreviousLocation()).toBe(previous);
        expect(previous!.position).toBe(previous!.position);
        expect(previous!.id).toBe(4);
        expect(previous!.state).toBe(TouchLocationState.PRESSED);
        expect(previous!.x).toBe(10);
        expect(previous!.y).toBe(20);
        expect(previous!.pressure).toBe(0.25);
        expect(previous!.isDown).toBe(true);
        expect(previous!.tryGetPreviousLocation()).toBeUndefined();
        expect(location.dX).toBe(2);
        expect(location.dY).toBe(-3);
        expect(location.delta).toBe(delta);
        expect(location.isMoved()).toBe(true);
        expect(location.isDown).toBe(true);

        location.state = TouchLocationState.RELEASED;
        expect(location.isReleased()).toBe(true);
        expect(location.isCancelled()).toBe(false);
        expect(location.isDown).toBe(false);

        location.state = TouchLocationState.CANCELLED;
        expect(location.isCancelled()).toBe(true);
        expect(location.isReleased()).toBe(false);
        expect(location.isPressed()).toBe(false);
        expect(location.isMoved()).toBe(false);
        expect(location.isDown).toBe(false);

        location.write(4, TouchLocationState.INVALID, 0, 0, 0);
        expect(location.isPressed()).toBe(false);
        expect(location.isMoved()).toBe(false);
        expect(location.isReleased()).toBe(false);
        expect(location.isCancelled()).toBe(false);
        expect(location.isDown).toBe(false);
        expect(location.tryGetPreviousLocation()).toBeUndefined();
        expect(location.tryGetPreviousLocation()).toBeUndefined();
        expect(location.position).toBe(position);
    });
});

describe("TouchCollection", () => {
    it("reports active contacts and treats a missing id as up", () => {
        const collection = new TouchCollection();
        const pressed = collection.tryAdd(1, TouchLocationState.PRESSED, 3, 4, 1);
        const moved = collection.tryAdd(
            2,
            TouchLocationState.MOVED,
            6,
            1,
            0.5,
            TouchLocationState.PRESSED,
            5,
            1,
            0.5,
        );
        const released = collection.tryAdd(3, TouchLocationState.RELEASED, 0, 0);
        const cancelled = collection.tryAdd(5, TouchLocationState.CANCELLED, 1, 1);
        const duplicate = collection.tryAdd(1, TouchLocationState.MOVED, 9, 9);

        expect(pressed).toBe(collection.get(0));
        expect(moved).toBe(collection.get(1));
        expect(released).toBe(collection.get(2));
        expect(cancelled).toBe(collection.get(3));
        expect(duplicate).toBe(collection.get(4));
        expect(collection.count).toBe(5);
        expect(collection.activeCount).toBe(3);
        expect(collection.get(0)!.x).toBe(3);
        expect(collection.get(0)!.y).toBe(4);
        expect(collection.get(1)!.dX).toBe(1);
        expect(collection.get(1)!.dY).toBe(0);

        expect(collection.findById(1)).toBe(pressed);
        expect(collection.findById(3)).toBe(released);
        expect(collection.findById(99)).toBeUndefined();
        expect(collection.get(-1)).toBeUndefined();
        expect(collection.get(5)).toBeUndefined();

        expect(collection.isDown(1)).toBe(true);
        expect(collection.isDown(2)).toBe(true);
        expect(collection.isDown(3)).toBe(false);
        expect(collection.isDown(99)).toBe(false);
        expect(collection.isReleased(3)).toBe(true);
        expect(collection.isReleased(1)).toBe(false);
        expect(collection.isReleased(5)).toBe(false);
        expect(collection.isReleased(99)).toBe(false);
        expect(collection.isCancelled(5)).toBe(true);
        expect(collection.isCancelled(3)).toBe(false);
        expect(collection.isCancelled(99)).toBe(false);
        expect(collection.isDown(5)).toBe(false);

        pressed!.state = TouchLocationState.RELEASED;
        expect(pressed!.isDown).toBe(false);
        expect(collection.activeCount).toBe(3);
        expect(collection.count).toBe(5);
    });

    it("reuses the same slots and vectors across reads and frames", () => {
        const collection = new TouchCollection();
        const first = collection.tryAdd(
            7,
            TouchLocationState.MOVED,
            8,
            12,
            0.4,
            TouchLocationState.PRESSED,
            6,
            9,
            0.2,
        );
        const previous = first!.tryGetPreviousLocation();

        expect(collection.get(0)).toBe(first);
        expect(collection.findById(7)).toBe(first);
        expect(collection.get(0)!.position).toBe(first!.position);
        expect(collection.get(0)!.delta).toBe(first!.delta);
        expect(collection.get(0)!.tryGetPreviousLocation()).toBe(previous);
        expect(first!.dX).toBe(2);
        expect(first!.dY).toBe(3);

        collection.clear();
        expect(collection.count).toBe(0);
        expect(collection.activeCount).toBe(0);
        expect(collection.get(0)).toBeUndefined();
        expect(collection.findById(7)).toBeUndefined();
        expect(collection.isDown(7)).toBe(false);
        expect(collection.isReleased(7)).toBe(false);

        const again = collection.tryAdd(4, TouchLocationState.PRESSED, 1, 2, 1);
        expect(again).toBe(first);
        expect(again!.position).toBe(first!.position);
        expect(again!.delta).toBe(first!.delta);
        expect(again!.tryGetPreviousLocation()).toBeUndefined();
        expect(again!.x).toBe(1);
        expect(again!.y).toBe(2);
        expect(again!.dX).toBe(0);
        expect(collection.count).toBe(1);
        expect(collection.activeCount).toBe(1);
        expect(collection.findById(7)).toBeUndefined();
        expect(collection.findById(4)).toBe(first);
    });

    it("stops adding once the fixed slot count is full", () => {
        const collection = new TouchCollection(2);
        const first = collection.tryAdd(1, TouchLocationState.PRESSED, 0, 0);
        const second = collection.tryAdd(2, TouchLocationState.MOVED, 1, 1);

        expect(collection.maxTouchCount).toBe(2);
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        expect(second).not.toBe(first);
        expect(collection.tryAdd(3, TouchLocationState.PRESSED, 2, 2)).toBeUndefined();
        expect(collection.count).toBe(2);
        expect(collection.activeCount).toBe(2);
        expect(collection.findById(3)).toBeUndefined();
        expect(collection.get(0)).toBe(first);
        expect(collection.get(1)).toBe(second);

        collection.clear();
        expect(collection.tryAdd(9, TouchLocationState.RELEASED, 4, 5)).toBe(first);
        expect(collection.count).toBe(1);
        expect(collection.activeCount).toBe(0);
        expect(collection.isReleased(9)).toBe(true);
    });

    it("stores nothing when the capacity is empty", () => {
        const collection = new TouchCollection(0);

        expect(collection.maxTouchCount).toBe(0);
        expect(collection.count).toBe(0);
        expect(collection.activeCount).toBe(0);
        expect(collection.tryAdd(1, TouchLocationState.PRESSED, 0, 0)).toBeUndefined();
        expect(collection.findById(1)).toBeUndefined();
        expect(new TouchCollection().maxTouchCount).toBe(TouchCollection.MAX_TOUCH_COUNT);
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

        const same = none;
        none.set(true, 5, true);
        expect(none).toBe(same);
        expect(none.isConnected).toBe(true);
        expect(none.maximumTouchCount).toBe(5);
        expect(none.hasPressure).toBe(true);

        none.isConnected = false;
        none.maximumTouchCount = 2;
        none.hasPressure = false;
        expect(none.isConnected).toBe(false);
        expect(none.maximumTouchCount).toBe(2);
        expect(none.hasPressure).toBe(false);
    });
});
