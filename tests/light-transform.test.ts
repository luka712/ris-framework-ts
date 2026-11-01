import {describe, expect, it} from "vitest";
import {vec3} from "gl-matrix";
import {AmbientLight} from "../src/api/lights/AmbientLight.ts";
import {DirectionalLight} from "../src/api/lights/DirectionalLight.ts";
import {PointLight} from "../src/api/lights/PointLight.ts";
import type {ILight} from "../src/api/lights/ILight.ts";
import {TransformNode} from "../src/api/scene/node/TransformNode.ts";

const close = (actual: ArrayLike<number>, expected: number[]) =>
    expected.forEach((v, i) => expect(actual[i]).toBeCloseTo(v, 5));

describe("light transforms", () => {
    it("every light is an ILight with its own transform", () => {
        const lights: ILight[] = [new AmbientLight(), new DirectionalLight(), new PointLight()];
        lights.forEach(l => expect(l.transform).toBeInstanceOf(TransformNode));
        expect(new Set(lights.map(l => l.transform)).size).toBe(3);
    });

    it("PointLight position round-trips through the transform", () => {
        const light = new PointLight({position: [1, 2, 3]});
        close(light.transform.position, [1, 2, 3]);
        light.setPosition([4, 5, 6]);
        close(light.transform.position, [4, 5, 6]);
        close(light.getPosition(), [4, 5, 6]);
        light.transform.position[0] = 7;
        close(light.getPosition(), [7, 5, 6]);
    });

    it("PointLight position is world space when parented", () => {
        const parent = new TransformNode();
        vec3.set(parent.position, 10, 0, 0);
        parent.rotation[1] = Math.PI / 2;
        const light = new PointLight({position: [1, 0, 0]});
        parent.addChild(light.transform);
        // Local (1,0,0) rotated 90° about Y is (0,0,-1), then offset by the parent.
        close(light.getPosition(), [10, 0, -1]);
        light.setPosition([0, 3, 0]);
        close(light.getPosition(), [0, 3, 0]);
    });

    it("DirectionalLight direction round-trips through the rotation", () => {
        const light = new DirectionalLight({direction: [0, 0, -2]});
        close(light.getDirection(), [0, 0, -1]);
        close(light.transform.rotation, [0, 0, 0]);
        const dir = vec3.normalize(vec3.create(), [-0.4, -0.6, 1]);
        light.setDirection([-0.4, -0.6, 1]);
        close(light.getDirection(), Array.from(dir));
        light.transform.rotation[1] = Math.PI / 2;
        light.transform.rotation[0] = 0;
        light.transform.rotation[2] = 0;
        close(light.getDirection(), [-1, 0, 0]);
    });

    it("DirectionalLight direction is world space when parented, and ignores position", () => {
        const parent = new TransformNode();
        vec3.set(parent.position, 5, 5, 5);
        parent.rotation[1] = Math.PI / 2;
        const light = new DirectionalLight({direction: [0, 0, -1]});
        parent.addChild(light.transform);
        close(light.getDirection(), [-1, 0, 0]);
        light.setDirection([0, -1, 0]);
        close(light.getDirection(), [0, -1, 0]);
        light.transform.position[0] = 100;
        close(light.getDirection(), [0, -1, 0]);
    });
});
