import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasManager } from "../src/api/canvas/CanvasManager.ts";

function stubFrames() {
    const pending = new Map<number, FrameRequestCallback>();
    let next = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { pending.set(next, cb); return next++; });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => { pending.delete(id); });
    const tick = () => { const cbs = [...pending.values()]; pending.clear(); cbs.forEach(cb => cb(0)); };
    return { pending, tick };
}

const canvas = () => ({ remove: vi.fn() }) as unknown as HTMLCanvasElement;

describe("CanvasManager", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("runs update before render each frame", () => {
        const { tick } = stubFrames();
        const manager = new CanvasManager(canvas());
        const order: string[] = [];
        manager.addRenderListener(() => order.push("render"));
        manager.addUpdateListener(() => order.push("update"));
        manager.runEventLoop();
        tick();
        expect(order).toEqual(["update", "render", "update", "render"]);
    });

    it("does not start a second loop when run twice", () => {
        const { pending, tick } = stubFrames();
        const manager = new CanvasManager(canvas());
        const update = vi.fn();
        manager.addUpdateListener(update);
        manager.runEventLoop();
        manager.runEventLoop();
        expect(pending.size).toBe(1);
        tick();
        expect(update).toHaveBeenCalledTimes(2);
    });

    it("stops and restarts", () => {
        const { pending, tick } = stubFrames();
        const manager = new CanvasManager(canvas());
        const update = vi.fn();
        manager.addUpdateListener(update);
        manager.runEventLoop();
        manager.stopEventLoop();
        expect(manager.eventLoopRunning).toBe(false);
        expect(pending.size).toBe(0);
        manager.runEventLoop();
        expect(manager.eventLoopRunning).toBe(true);
        expect(pending.size).toBe(1);
        tick();
        expect(update).toHaveBeenCalledTimes(3);
    });

    it("stops when a listener stops the loop mid-frame", () => {
        const { pending } = stubFrames();
        const manager = new CanvasManager(canvas());
        manager.addUpdateListener(() => manager.stopEventLoop());
        manager.runEventLoop();
        expect(pending.size).toBe(0);
    });

    it("lets a listener remove itself without skipping the next one", () => {
        stubFrames();
        const manager = new CanvasManager(canvas());
        const second = vi.fn();
        const first = () => manager.removeUpdateListener(first);
        manager.addUpdateListener(first);
        manager.addUpdateListener(second);
        manager.runEventLoop();
        expect(second).toHaveBeenCalledOnce();
    });

    it("dispose stops the loop and does not remove a canvas it did not create", () => {
        const { pending } = stubFrames();
        const c = canvas();
        const manager = new CanvasManager(c);
        manager.runEventLoop();
        manager.dispose();
        manager.runEventLoop();
        expect(pending.size).toBe(0);
        expect(c.remove).not.toHaveBeenCalled();
    });
});
