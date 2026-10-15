import { describe, expect, it, vi } from "vitest";
import type { IFramework } from "../src/api/IFramework.ts";

const created: { id: string; values?: { [id: string]: number } }[] = [];
vi.mock("../src/webgl/shader/WebGlShaderModule.ts", () => ({
    default: class {
        public constructor(_framework: unknown, id: string, values?: { [id: string]: number }) {
            created.push({ id, values });
        }
    },
}));

const { WebGlShaderModuleLoader, shaderModuleCacheKey } = await import("../src/webgl/shader/WebGlShaderModuleLoader.ts");

describe("shader module cache key", () => {
    it("includes sorted replacement values", () => {
        expect(shaderModuleCacheKey("sprite")).toBe("sprite");
        expect(shaderModuleCacheKey("sprite", {})).toBe("sprite");
        expect(shaderModuleCacheKey("lit", { B: 2, A: 1 })).toBe("lit?A=1&B=2");
        expect(shaderModuleCacheKey("lit", { A: 1, B: 2 })).toBe(shaderModuleCacheKey("lit", { B: 2, A: 1 }));
    });

    it("compiles one module per distinct light counts and reuses equal ones", () => {
        created.length = 0;
        const loader = new WebGlShaderModuleLoader({} as IFramework);
        const a = loader.load("forward_blinn_phong_material", { DIRECTIONAL_LIGHTS_COUNT: 3, POINT_LIGHTS_COUNT: 3 });
        const b = loader.load("forward_blinn_phong_material", { DIRECTIONAL_LIGHTS_COUNT: 1, POINT_LIGHTS_COUNT: 2 });
        const c = loader.load("forward_blinn_phong_material", { POINT_LIGHTS_COUNT: 3, DIRECTIONAL_LIGHTS_COUNT: 3 });

        expect(a).not.toBe(b);
        expect(c).toBe(a);
        expect(created.map(m => m.values)).toEqual([
            { DIRECTIONAL_LIGHTS_COUNT: 3, POINT_LIGHTS_COUNT: 3 },
            { DIRECTIONAL_LIGHTS_COUNT: 1, POINT_LIGHTS_COUNT: 2 },
        ]);
    });
});
