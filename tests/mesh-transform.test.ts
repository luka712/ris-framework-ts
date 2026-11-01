import { describe, expect, it, vi } from "vitest";
import { mat4 } from "gl-matrix";
import { RenderableMesh } from "../src/api/meshes/RenderableMesh.ts";
import type { IFramework } from "../src/api/IFramework.ts";
import type { IMaterial } from "../src/api/material/IMaterial.ts";

const framework = {} as IFramework;

type FakeBuffer = { data: number[]; update: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> };
function bufferFramework() {
    const buffers: FakeBuffer[] = [];
    const createUniformBuffer = vi.fn((data: ArrayLike<number>) => {
        const buffer: FakeBuffer = { data: Array.from(data), update: vi.fn(), dispose: vi.fn() };
        buffers.push(buffer);
        return buffer;
    });
    return { framework: { bufferFactory: { createUniformBuffer } } as unknown as IFramework, buffers };
}

/** A material that uses a model buffer, recording the bound buffer at each beforeRender. */
const material = () => {
    const m = { modelBuffer: undefined as unknown, seen: [] as unknown[], beforeRender: vi.fn(), renderMesh: vi.fn() };
    m.beforeRender.mockImplementation(() => m.seen.push(m.modelBuffer));
    return m;
};

describe("RenderableMesh transform", () => {
    it("defaults to identity (position 0, rotation 0, scale 1)", () => {
        const mesh = new RenderableMesh(framework);
        expect([...mesh.position]).toEqual([0, 0, 0]);
        expect([...mesh.rotation]).toEqual([0, 0, 0]);
        expect([...mesh.scale]).toEqual([1, 1, 1]);
        expect(mat4.equals(mesh.modelMatrix, mat4.create())).toBe(true);
    });

    it("composes T * Ry * Rx * Rz * S and recomputes after in-place edits", () => {
        const mesh = new RenderableMesh(framework);
        mesh.position = [1, 2, 3];
        mesh.rotation = [0.3, 0.5, 0.7];
        mesh.scale[0] = 2; // in-place edit
        const expected = mat4.fromTranslation(mat4.create(), [1, 2, 3]);
        mat4.rotateY(expected, expected, 0.5);
        mat4.rotateX(expected, expected, 0.3);
        mat4.rotateZ(expected, expected, 0.7);
        mat4.scale(expected, expected, [2, 1, 1]);
        expect(mat4.equals(mesh.modelMatrix, expected)).toBe(true);

        const first = mesh.modelMatrix;
        mesh.position[1] = 5;
        expect(mesh.modelMatrix).toBe(first);
        expect(mesh.modelMatrix[13]).toBeCloseTo(5);
    });

    it("owns a model buffer, assigns it to its material and uploads only when the transform changed", () => {
        const { framework: fw, buffers } = bufferFramework();
        const m = material();
        const mesh = new RenderableMesh(fw, m as unknown as IMaterial);
        mesh.position = [4, 0, 0];
        mesh.render();
        expect(buffers).toHaveLength(1);
        expect(m.seen[0]).toBe(buffers[0]);
        expect(mesh.modelBuffer).toBe(buffers[0]);
        expect(buffers[0].data[12]).toBe(4);
        expect(m.renderMesh).toHaveBeenCalledWith(mesh);

        mesh.render();
        expect(buffers[0].update).not.toHaveBeenCalled();
        mesh.position[0] = 5;
        mesh.render();
        expect(buffers[0].update).toHaveBeenCalledOnce();
        expect(Array.from(buffers[0].update.mock.calls[0][0] as number[])[12]).toBe(5);

        mesh.dispose();
        expect(buffers[0].dispose).toHaveBeenCalledOnce();
    });

    it("skips materials without a modelBuffer property and creates no buffer for them", () => {
        const { framework: fw, buffers } = bufferFramework();
        const sprite = { beforeRender: vi.fn(), renderMesh: vi.fn() };
        new RenderableMesh(fw, sprite as unknown as IMaterial).render();
        expect(buffers).toHaveLength(0);
        expect("modelBuffer" in sprite).toBe(false);
    });

    it("submeshes share the parent's model buffer and assign it to their materials", () => {
        const { framework: fw, buffers } = bufferFramework();
        const mesh = new RenderableMesh(fw);
        const a = material(), b = material();
        const subA = mesh.addSubMesh(a as unknown as IMaterial, 0, 3);
        mesh.addSubMesh(b as unknown as IMaterial, 3, 3);
        mesh.rotation[1] = Math.PI / 2;
        expect(subA.modelMatrix).toBe(mesh.modelMatrix);
        expect(subA.rotation).toBe(mesh.rotation);
        mesh.render();
        expect(buffers).toHaveLength(1);
        expect(subA.modelBuffer).toBe(buffers[0]);
        expect(a.seen[0]).toBe(buffers[0]);
        expect(b.seen[0]).toBe(buffers[0]);
        const expected = Array.from(mat4.fromYRotation(mat4.create(), Math.PI / 2));
        buffers[0].data.forEach((v, i) => expect(v).toBeCloseTo(expected[i]));
    });
});

describe("RenderableMesh sub meshes", () => {
    const buffers = () => ({ vertexBuffer: { dispose: vi.fn() }, indexBuffer: { dispose: vi.fn() } });

    it("draws its own range first, then the sub meshes; a root without material draws only sub meshes", () => {
        const { framework: fw } = bufferFramework();
        const order: string[] = [];
        const mat = (name: string) => ({ beforeRender: vi.fn(), renderMesh: vi.fn(() => order.push(name)) }) as unknown as IMaterial;
        const root = new RenderableMesh(fw, mat("root"));
        root.addSubMesh(mat("a"), 0, 3);
        root.addSubMesh(mat("b"), 3, 6);
        root.render();
        expect(order).toEqual(["root", "a", "b"]);

        order.length = 0;
        const bare = new RenderableMesh(fw);
        bare.addSubMesh(mat("c"), 0, 3);
        bare.render();
        expect(order).toEqual(["c"]);
    });

    it("sub meshes share the parent's buffers, store their range and default to all indices", () => {
        const root = new RenderableMesh(framework);
        const b = buffers();
        Object.assign(root, { _vertexBuffer: b.vertexBuffer, _indexBuffer: b.indexBuffer });
        const sub = root.addSubMesh(undefined, 6, 9);
        expect(sub.parent).toBe(root);
        expect(sub.vertexBuffer).toBe(b.vertexBuffer);
        expect(sub.indexBuffer).toBe(b.indexBuffer);
        expect([sub.indexStart, sub.indexCount]).toEqual([6, 9]);
        expect([root.indexStart, root.indexCount]).toEqual([0, -1]);
        expect(new RenderableMesh(framework, undefined, root, 1, 2).parent).toBe(root);
        expect(root.subMeshes).toHaveLength(2);
    });

    it("disposing the root frees the shared buffers once and never the materials", () => {
        const root = new RenderableMesh(framework);
        const b = buffers();
        Object.assign(root, { _vertexBuffer: b.vertexBuffer, _indexBuffer: b.indexBuffer });
        const material = { dispose: vi.fn() } as unknown as IMaterial;
        const sub = root.addSubMesh(material, 0, 3);
        sub.dispose();
        expect(b.vertexBuffer.dispose).not.toHaveBeenCalled();
        root.dispose();
        expect(b.vertexBuffer.dispose).toHaveBeenCalledOnce();
        expect(b.indexBuffer.dispose).toHaveBeenCalledOnce();
        expect(material.dispose).not.toHaveBeenCalled();
        expect(root.subMeshes).toHaveLength(0);
    });
});
