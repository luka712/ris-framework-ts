import { afterEach, describe, expect, it, vi } from "vitest";
import { GameTime, TimeManager } from "../src/index.ts";

describe("GameTime", () => {
    it("converts millisecond fields to seconds", () => {
        const time = new GameTime();

        expect(time.elapsedTimeMs).toBe(0);
        expect(time.deltaTimeMs).toBe(0);
        expect(time.elapsedTimeSec).toBe(0);
        expect(time.deltaTimeSec).toBe(0);

        time.elapsedTimeMs = 1500;
        time.deltaTimeMs = 16;

        expect(time.elapsedTimeSec).toBeCloseTo(1.5, 12);
        expect(time.deltaTimeSec).toBeCloseTo(0.016, 12);
    });
});

describe("TimeManager", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("resets elapsed time and accumulates frame deltas from Date.now", () => {
        const now = vi.spyOn(Date, "now");
        now.mockReturnValue(5_000);
        const manager = new TimeManager();

        manager.prepareStart();
        expect(manager.time.elapsedTimeMs).toBe(0);
        expect(manager.time.deltaTimeMs).toBe(0);

        now.mockReturnValue(5_600);
        manager.frameStart();
        expect(manager.time.deltaTimeMs).toBe(600);
        expect(manager.time.elapsedTimeMs).toBe(600);
        expect(manager.time.deltaTimeSec).toBeCloseTo(0.6, 12);
        expect(manager.time.elapsedTimeSec).toBeCloseTo(0.6, 12);

        now.mockReturnValue(5_750);
        manager.frameStart();
        expect(manager.time.deltaTimeMs).toBe(150);
        expect(manager.time.elapsedTimeMs).toBe(750);

        now.mockReturnValue(9_000);
        manager.prepareStart();
        expect(manager.time.elapsedTimeMs).toBe(0);
        expect(manager.time.deltaTimeMs).toBe(150);

        now.mockReturnValue(9_100);
        manager.frameStart();
        expect(manager.time.deltaTimeMs).toBe(100);
        expect(manager.time.elapsedTimeMs).toBe(100);
    });
});
