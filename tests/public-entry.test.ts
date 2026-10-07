import { describe, expect, it } from "vitest";
import { vec2 } from "gl-matrix";
import {
    BufferUsage,
    GamePadThumbSticks,
    GameTime,
    VertexAttribute,
    VertexStepMode,
    type IBuffer,
    type ITimeManager,
    type IVertexBufferLayout,
} from "../src/api/index.ts";

describe("public entry", () => {
    it("re-exports buffer, input, and time symbols that public signatures already name", () => {
        const sticks = new GamePadThumbSticks(vec2.fromValues(0, 0), vec2.fromValues(1, 1));
        expect(sticks.left[0]).toBe(0);
        expect(sticks.right[0]).toBe(1);

        const attribute = new VertexAttribute();
        const layout: IVertexBufferLayout = {
            arrayStride: 12,
            stepMode: VertexStepMode.VERTEX,
            attributes: [attribute],
        };
        const buffer: IBuffer = {
            byteSize: layout.arrayStride,
            usage: BufferUsage.VERTEX,
            dispose() {},
        };
        const time: ITimeManager = {
            time: new GameTime(),
            prepareStart() {},
            frameStart() {},
        };

        expect(attribute.shaderLocation).toBe(0);
        expect(layout.stepMode).toBe(VertexStepMode.VERTEX);
        expect(VertexStepMode.INSTANCE).toBe(1);
        expect(buffer.byteSize).toBe(12);
        expect(buffer.usage).toBe(BufferUsage.VERTEX);
        expect(time.time.elapsedTimeMs).toBe(0);
    });
});
