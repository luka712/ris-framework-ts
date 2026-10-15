import { describe, expect, it, vi } from "vitest";
import { Color } from "../src/api/data/Color.ts";
import { AmbientLight } from "../src/api/lights/AmbientLight.ts";
import { DirectionalLight } from "../src/api/lights/DirectionalLight.ts";
import { PointLight } from "../src/api/lights/PointLight.ts";
import { DEFAULT_DIRECTIONAL_LIGHTS_COUNT, DEFAULT_POINT_LIGHTS_COUNT } from "../src/api/lights/LightsBuffer.ts";
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

const sun = () => new DirectionalLight({ color: new Color(0.8, 0.7, 0.6), direction: [0, -1, 0] });
const lamp = () => new PointLight({ color: new Color(1, 0.5, 0.25), position: [1, 2, 3], constant: 1, linear: 0.35, quadratic: 0.44 });

describe("light classes", () => {
    it("AmbientLight defaults to black, intensity 1 and an auto id", () => {
        const light = new AmbientLight({ name: "fill" });
        expect(light.name).toBe("fill");
        expect([...light.color]).toEqual([0, 0, 0, 1]);
        expect(light.intensity).toBe(1);
        expect(Number.isInteger(light.id)).toBe(true);
    });

    it("DirectionalLight defaults to white, intensity 1, pointing down", () => {
        const light = new DirectionalLight();
        expect([...light.color]).toEqual([1, 1, 1, 1]);
        expect(light.intensity).toBe(1);
        expect([...light.direction]).toEqual([0, -1, 0]);
    });

    it("PointLight defaults to white at the origin with the default attenuation", () => {
        const light = new PointLight();
        expect([...light.color]).toEqual([1, 1, 1, 1]);
        expect(light.intensity).toBe(1);
        expect([...light.position]).toEqual([0, 0, 0]);
        expect([light.constant, light.linear, light.quadratic])
            .toEqual([PointLight.DEFAULT_CONSTANT, PointLight.DEFAULT_LINEAR, PointLight.DEFAULT_QUADRATIC]);
    });

    it("assigns unique ids across kinds, keeps an explicit id and copies descriptor values", () => {
        const color = new Color(0.1, 0.2, 0.3);
        const position: [number, number, number] = [1, 2, 3];
        const ids = [new AmbientLight().id, new DirectionalLight().id, new PointLight().id, new PointLight().id];
        expect(new Set(ids).size).toBe(4);
        expect(new PointLight({ id: 42 }).id).toBe(42);

        const light = new PointLight({ color, position });
        expect(light.color).not.toBe(color);
        expect(light.position).not.toBe(position);
        color.r = 1;
        position[0] = 9;
        expect(light.color.r).toBeCloseTo(0.1);
        expect(light.position[0]).toBe(1);
    });
});

describe("WebGlLightsBuffer", () => {
    it("creates a std140 buffer: ambient vec3 + N directional {vec3 light, vec3 direction}", () => {
        const { framework, buffer, createUniformBuffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, {
            ambientLight: new AmbientLight({ color: new Color(0.2, 0.3, 0.4) }),
            directionalLights: [sun()],
            maxDirectionalLights: 2,
            maxPointLights: 0,
        });

        expect(lights.buffer).toBe(buffer);
        expect(Array.from(createUniformBuffer.mock.calls[0][0])).toEqual([
            0.2, 0.3, 0.4, 0,
            0.8, 0.7, 0.6, 0, 0, -1, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ].map(v => expect.closeTo(v, 6)));
    });

    it("appends std140 point lights {vec3 light, float constant, vec3 position, float linear, float quadratic}", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        new WebGlLightsBuffer(framework, {
            directionalLights: [sun()],
            maxDirectionalLights: 1,
            pointLights: [lamp()],
            maxPointLights: 2,
        });

        const data = Array.from(createUniformBuffer.mock.calls[0][0]);
        expect(data).toHaveLength(4 + 8 + 2 * 12);
        expect(data.slice(12)).toEqual([
            1, 0.5, 0.25, 1, 1, 2, 3, 0.35, 0.44, 0, 0, 0,
            0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
        ]);
    });

    it("writes every light colour premultiplied by its intensity", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        new WebGlLightsBuffer(framework, {
            ambientLight: new AmbientLight({ color: new Color(0.5, 0.25, 1), intensity: 2 }),
            directionalLights: [new DirectionalLight({ color: new Color(1, 0.5, 0.25), intensity: 0.5 })],
            maxDirectionalLights: 1,
            pointLights: [new PointLight({ color: new Color(0.5, 0.5, 0.5), intensity: 4 })],
            maxPointLights: 1,
        });

        const data = Array.from(createUniformBuffer.mock.calls[0][0]);
        expect(data.slice(0, 3)).toEqual([1, 0.5, 2]);
        expect(data.slice(4, 7)).toEqual([0.5, 0.25, 0.125]);
        expect(data.slice(12, 15)).toEqual([2, 2, 2]);
    });

    it("defaults to a black ambient light and the shader's light counts", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework);

        expect(lights.maxDirectionalLights).toBe(DEFAULT_DIRECTIONAL_LIGHTS_COUNT);
        expect(lights.maxPointLights).toBe(DEFAULT_POINT_LIGHTS_COUNT);
        const data = Array.from(createUniformBuffer.mock.calls[0][0]);
        const directionalEnd = 4 + 8 * DEFAULT_DIRECTIONAL_LIGHTS_COUNT;
        expect(data).toHaveLength(directionalEnd + 12 * DEFAULT_POINT_LIGHTS_COUNT);
        expect(data.slice(0, directionalEnd).every(v => v === 0)).toBe(true);
        // Empty point slots are black with constant attenuation 1 (no division by zero in the shader).
        for (let i = 0; i < DEFAULT_POINT_LIGHTS_COUNT; i++) {
            expect(data.slice(directionalEnd + 12 * i, directionalEnd + 12 * (i + 1))).toEqual([0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
        }
    });

    it("uploads only when light data changed, including in-place edits and intensity", () => {
        const { framework, buffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, { maxDirectionalLights: 1, maxPointLights: 1 });

        lights.update();
        expect(buffer.update).not.toHaveBeenCalled();

        lights.ambientLight.color.set(new Color(0.5, 0.5, 0.5));
        lights.update();
        expect(buffer.update).toHaveBeenCalledTimes(1);
        lights.update();
        expect(buffer.update).toHaveBeenCalledTimes(1);

        lights.ambientLight.intensity = 2;
        lights.update();
        expect(buffer.update).toHaveBeenCalledTimes(2);
        expect((buffer.update.mock.calls[1][0] as number[]).slice(0, 4)).toEqual([1, 1, 1, 0]);

        const point = lamp();
        lights.add(point);
        lights.update();
        expect(buffer.update).toHaveBeenCalledTimes(3);

        point.position = [4, 5, 6];
        lights.update();
        expect(buffer.update).toHaveBeenCalledTimes(4);
        expect((buffer.update.mock.calls[3][0] as number[]).slice(12, 24)).toEqual([1, 0.5, 0.25, 1, 4, 5, 6, 0.35, 0.44, 0, 0, 0]);
    });

    it("replaces the ambient light through its setter", () => {
        const { framework, buffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, { maxDirectionalLights: 0, maxPointLights: 0 });
        const ambient = new AmbientLight({ color: new Color(0.25, 0.25, 0.25) });

        lights.ambientLight = ambient;
        lights.update();
        expect(lights.ambientLight).toBe(ambient);
        expect(buffer.update.mock.calls[0][0]).toEqual([0.25, 0.25, 0.25, 0]);
    });

    it("adds and removes lights by kind; adding twice is a no-op", () => {
        const { framework, buffer } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, { maxDirectionalLights: 2, maxPointLights: 2 });
        const a = sun();
        const p = lamp();

        lights.add(a);
        lights.add(a);
        lights.add(p);
        expect(lights.directionalLights).toEqual([a]);
        expect(lights.pointLights).toEqual([p]);

        lights.update();
        expect(lights.remove(a)).toBe(true);
        expect(lights.remove(a)).toBe(false);
        expect(lights.directionalLights).toEqual([]);
        lights.update();
        // The freed slot is written as black again.
        expect((buffer.update.mock.calls[1][0] as number[]).slice(4, 12)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it("throws a clear error when a kind's slots are full", () => {
        const { framework } = fakeFramework();
        const lights = new WebGlLightsBuffer(framework, { maxDirectionalLights: 1, maxPointLights: 2 });
        lights.add(sun());
        lights.add(lamp());
        lights.add(lamp());

        expect(() => lights.add(sun())).toThrow(/all 1 directional light slots are in use \(maxDirectionalLights = 1\)/);
        expect(() => lights.add(lamp())).toThrow(/all 2 point light slots are in use \(maxPointLights = 2\)/);
        expect(() => new WebGlLightsBuffer(framework, { pointLights: [lamp(), lamp()], maxPointLights: 1 })).toThrow(/point light slots/);
        expect(() => lights.add({} as PointLight)).toThrow(/DirectionalLight or PointLight/);
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
    it("creates ambient lights with unique ids, the descriptor's colour and name", () => {
        const { framework, createUniformBuffer } = fakeFramework();
        const factory = new WebGlAmbientLightFactory(framework);

        const a = factory.createAmbientLight({ name: "a", color: new Color(0.2, 0.2, 0.2), intensity: 3 });
        const b = factory.createAmbientLight();

        expect(a).toBeInstanceOf(AmbientLight);
        expect(a.id).not.toBe(b.id);
        expect([a.name, a.intensity]).toEqual(["a", 3]);
        expect(b.color.equals(WebGlAmbientLightFactory.DEFAULT_COLOR)).toBe(true);
        expect(b.color).not.toBe(WebGlAmbientLightFactory.DEFAULT_COLOR);
        expect(createUniformBuffer).not.toHaveBeenCalled();
    });

    it("creates a lights buffer holding the given lights", () => {
        const { framework } = fakeFramework();
        const factory = new WebGlAmbientLightFactory(framework);
        const ambientLight = factory.createAmbientLight();
        const light = sun();

        const lights = factory.__createLightsBuffer({ ambientLight, directionalLights: [light] });

        expect(lights).toBeInstanceOf(WebGlLightsBuffer);
        expect(lights.ambientLight).toBe(ambientLight);
        expect(lights.directionalLights).toEqual([light]);
    });
});
