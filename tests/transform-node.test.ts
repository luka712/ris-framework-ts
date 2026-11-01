import { describe, expect, it, vi } from "vitest";
import { mat4 } from "gl-matrix";
import { Node, TransformNode, type ISceneObject, Scene } from "../src/api/index.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import type { GameTime } from "../src/api/time/GameTime.ts";

describe("TransformNode", () => {
    it("computes T * Ry * Rx * Rz * S without update() and detects in-place edits", () => {
        const node = new TransformNode();
        expect(mat4.equals(node.modelMatrix, mat4.create())).toBe(true);

        node.position = [1, 2, 3];
        node.rotation[1] = 0.5;
        node.scale[0] = 2;
        const expected = mat4.fromTranslation(mat4.create(), [1, 2, 3]);
        mat4.rotateY(expected, expected, 0.5);
        mat4.scale(expected, expected, [2, 1, 1]);
        expect(mat4.equals(node.modelMatrix, expected)).toBe(true);

        const first = node.modelMatrix;
        node.position[1] = 5;
        expect(node.modelMatrix).toBe(first);
        expect(node.modelMatrix[13]).toBeCloseTo(5);
    });

    it("multiplies the parent's world matrix with the local matrix", () => {
        const parent = new TransformNode();
        const child = new TransformNode();
        parent.addChild(child);
        expect(child.parent).toBe(parent);
        expect(parent.children).toEqual([child]);

        parent.position = [10, 0, 0];
        parent.scale = [2, 2, 2];
        child.position = [1, 0, 0];
        expect(child.modelMatrix[12]).toBeCloseTo(12);
        expect(child.modelMatrix[0]).toBeCloseTo(2);

        parent.position[0] = 20;
        expect(child.modelMatrix[12]).toBeCloseTo(22);

        expect(parent.removeChild(child)).toBe(true);
        expect(child.parent).toBeUndefined();
        expect(child.modelMatrix[12]).toBeCloseTo(1);
    });

    it("moves a child between parents and rejects cycles", () => {
        const a = new Node(), b = new Node(), c = new Node();
        a.addChild(c);
        b.addChild(c);
        expect(a.children).toHaveLength(0);
        expect(c.parent).toBe(b);
        expect(() => c.addChild(b)).toThrow();
    });
});

describe("Scene nodes", () => {
    const framework = { lightsFactory: { createAmbientLight: () => ({}) } } as unknown as IFramework;

    it("adds, updates and removes a scene object", () => {
        const scene = new Scene(framework);
        const transform = new TransformNode();
        const update = vi.spyOn(transform, "update");
        const obj: ISceneObject = { transform };

        scene.add(obj);
        scene.add(obj);
        expect(scene.nodes).toEqual([obj]);
        expect(scene.meshes).toHaveLength(0);

        const time = {} as GameTime;
        scene.update(time);
        expect(update).toHaveBeenCalledWith(time);

        expect(scene.remove(obj)).toBe(true);
        expect(scene.nodes).toHaveLength(0);
    });
});
