import { describe, expect, it, vi } from "vitest";
import { Color } from "../src/api/data/Color.ts";
import { AmbientLight } from "../src/api/lights/AmbientLight.ts";
import { DEFAULT_DIRECTIONAL_LIGHTS_COUNT } from "../src/api/lights/LightsBuffer.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import { WebGlLightsBuffer } from "../src/webgl/lights/WebGlLightsBuffer.ts";
import { WebGlAmbientLightFactory } from "../src/webgl/lights/WebGlAmbientLightFactory.ts";

function fakeFramework() {
    const buffer = { update: vi.fn(), dispose: vi.fn() };
    const createUniformBuffer = vi.fn((data: ArrayLike<number>) => {
        void data;
        return buffer;
    });
    const framework = { bufferFactory: { createUniformBuffer } } as unknown as IFramework;
    return { framework, buffer, createUniformBuffer };
}

const sun = { id: 2, value: new Color(0.8, 0.7, 0.6), direction: [0, -1, 0] as [number, number, number] };

describe("AmbientLight", () => {
    it("is plain data with a black default", () => {
        const light = new AmbientLight(3, undefined, "fill");
        expect([light.id, light.name]).toEqual([3, "fill"]);
        expect([...light.value]).toEqual([0, 0, 0, 1]);
    });
});

describe("WebGlLightsBuffer", () => {
    it("creates a std140 buffer: ambient vec3 + N directional {vec3 light, vec3 direction}", () => {
        const { framework, buffer, createUniformBuffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, {
            ambientLight: new AmbientLight(1, new Color(0.2, 0.3, 0.4)),
            directionalLights: [sun],
            maxDirectionalLights: 2,
        });

        expect(lights.buffer).toBe(buffer);
        expect(Array.from(createUniformBuffer.mock.calls[0][0])).toEqual([
            0.2, 0.3, 0.4, 0,
            0.8, 0.7, 0.6, 0, 0, -1, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ]);
    });

    it("defaults to a black ambient light and the shader's directional light count", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework);

        expect(lights.maxDirectionalLights).toBe(DEFAULT_DIRECTIONAL_LIGHTS_COUNT);
        expect(createUniformBuffer.mock.calls[0][0]).toHaveLength(4 + 8 * DEFAULT_DIRECTIONAL_LIGHTS_COUNT);
        expect(Array.from(createUniformBuffer.mock.calls[0][0]).every(v => v === 0)).toBe(true);
    });

    it("uploads only when light data changed, including in-place edits", () => {
        const { framework, buffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, { maxDirectionalLights: 1 });

        lights.update();
        expect(buffer.update).not.toHaveBeenCalled();

        lights.ambientLight.value.set(new Color(0.5, 0.5, 0.5));
        lights.update();
        expect(buffer.update).toHaveBeenCalledOnce();
        expect((buffer.update.mock.calls[0][0] as number[]).slice(0, 4)).toEqual([0.5, 0.5, 0.5, 0]);

        lights.update();
        expect(buffer.update).toHaveBeenCalledOnce();

        lights.directionalLights.push({ ...sun, direction: [1, 0, 0] });
        lights.update();
        expect(buffer.update).toHaveBeenCalledTimes(2);
        expect((buffer.update.mock.calls[1][0] as number[]).slice(4, 12)).toEqual([0.8, 0.7, 0.6, 0, 1, 0, 0, 0]);
    });

    it("writes at most maxDirectionalLights lights", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        new WebGlLightsBuffer(framework, { directionalLights: [sun, sun], maxDirectionalLights: 1 });
        expect(createUniformBuffer.mock.calls[0][0]).toHaveLength(12);
    });

    it("disposes its buffer once", () => {
        const { framework, buffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework);

        lights.dispose();
        lights.dispose();
        expect(buffer.dispose).toHaveBeenCalledOnce();
    });
});

describe("WebGlAmbientLightFactory", () => {
    it("creates plain ambient lights with unique ids, the descriptor's value and name", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        const factory = new WebGlAmbientLightFactory(framework);

        const a = factory.createAmbientLight({ name: "a", value: new Color(0.2, 0.2, 0.2) });
        const b = factory.createAmbientLight();

        expect(a).toBeInstanceOf(AmbientLight);
        expect(a.id).not.toBe(b.id);
        expect(a.name).toBe("a");
        expect(b.value.equals(WebGlAmbientLightFactory.DEFAULT_VALUE)).toBe(true);
        expect(b.value).not.toBe(WebGlAmbientLightFactory.DEFAULT_VALUE);
        expect(createUniformBuffer).not.toHaveBeenCalled();
    });

    it("creates a lights buffer holding the given lights", () => {
        const { framework } = fakeFramework();
        const factory = new WebGlAmbientLightFactory(framework);
        const ambientLight = factory.createAmbientLight();

        const lights = factory.createLightsBuffer({ ambientLight, directionalLights: [sun] });

        expect(lights).toBeInstanceOf(WebGlLightsBuffer);
        expect(lights.ambientLight).toBe(ambientLight);
        expect(lights.directionalLights).toEqual([sun]);
    });
});
