import { afterEach, describe, expect, it, vi } from "vitest";
import { Framework } from "../src/Framework.ts";
import { FrameworkConfiguration } from "../src/api/FrameworkConfiguration.ts";
import { TextureFormat } from "../src/api/rendering/texture/TextureFormat.ts";
import { WebGlTexture2D } from "../src/webgl/texture/WebGlTexture2D.ts";

/** A WebGL2 context stand-in: every call is recorded; created objects remember the context that made them. */
function fakeGl(name: string) {
    const created: { ctx: string; kind: string }[] = [];
    const calls: Record<string, unknown[][]> = {};
    const make = (kind: string) => () => {
        const object = { ctx: name, kind };
        created.push(object);
        return object;
    };
    const special: Record<string, unknown> = {
        createTexture: make("texture"),
        createShader: make("shader"),
        createProgram: make("program"),
        getError: () => 0,
        getShaderParameter: () => true,
        getProgramParameter: () => true,
        getExtension: () => null,
    };
    const gl = new Proxy({}, {
        get: (_target, prop: string) => {
            const fn = special[prop] ?? (() => undefined);
            return (...args: unknown[]) => {
                (calls[prop] ??= []).push(args);
                return (fn as (...a: unknown[]) => unknown)(...args);
            };
        },
    }) as unknown as WebGL2RenderingContext;
    return { gl, created, calls };
}

function createFramework(name: string) {
    const canvas = { addEventListener: vi.fn(), style: {}, width: 800, height: 600 } as unknown as HTMLCanvasElement;
    const config = new FrameworkConfiguration();
    config.canvas = canvas;
    const framework = new Framework(config);
    const context = fakeGl(name);
    const graphicsDevice = { gl: context.gl, dispose: vi.fn() };
    // Stand in for renderer.initialize(), which needs a real canvas.
    Object.defineProperty(framework.renderer, "graphicsDevice", { get: () => graphicsDevice, configurable: true });
    Object.defineProperty(framework.renderer, "preferredTextureFormat", { get: () => TextureFormat.RGBA_8_UNORM, configurable: true });
    return { framework, graphicsDevice, ...context };
}

describe("Framework.dispose", () => {
    // The texture upload checks for DOM image sources, which node does not have.
    for (const name of ["HTMLImageElement"]) {
        if (!(name in globalThis)) {
            (globalThis as Record<string, unknown>)[name] = class {};
        }
    }
    afterEach(() => vi.restoreAllMocks());

    it("disposes the default texture so a new framework creates one on its own context", () => {
        const first = createFramework("first");
        const oldDefault = WebGlTexture2D.getOrCreateDefault(first.framework);
        expect(WebGlTexture2D.getOrCreateDefault(first.framework)).toBe(oldDefault);
        expect((oldDefault.glTexture as unknown as { ctx: string }).ctx).toBe("first");

        first.framework.dispose();
        const oldGlTexture = first.created.find(o => o.kind === "texture");
        expect(first.calls.deleteTexture?.map(args => args[0])).toContain(oldGlTexture);
        expect(first.graphicsDevice.dispose).toHaveBeenCalledOnce();

        const second = createFramework("second");
        const newDefault = WebGlTexture2D.getOrCreateDefault(second.framework);
        expect(newDefault).not.toBe(oldDefault);
        expect((newDefault.glTexture as unknown as { ctx: string }).ctx).toBe("second");
        second.framework.dispose();
    });

    it("keeps default textures separate for frameworks alive at the same time", () => {
        const a = createFramework("a");
        const b = createFramework("b");
        expect(WebGlTexture2D.getOrCreateDefault(a.framework)).not.toBe(WebGlTexture2D.getOrCreateDefault(b.framework));
        a.framework.dispose();
        b.framework.dispose();
    });

    it("deletes cached shader programs so a new framework compiles on its own context", () => {
        const first = createFramework("first");
        const oldModule = first.framework.content.loadShaderModule("sprite");
        expect(first.framework.content.loadShaderModule("sprite")).toBe(oldModule);

        first.framework.dispose();
        expect(first.calls.deleteProgram).toHaveLength(1);

        const second = createFramework("second");
        const newModule = second.framework.content.loadShaderModule("sprite");
        expect(newModule).not.toBe(oldModule);
        expect(second.created.some(o => o.kind === "program")).toBe(true);
        second.framework.dispose();
    });

    it("is idempotent and stops the event loop", () => {
        const raf = vi.fn(() => 7);
        const caf = vi.fn();
        vi.stubGlobal("requestAnimationFrame", raf);
        vi.stubGlobal("cancelAnimationFrame", caf);
        const { framework } = createFramework("x");
        const tick = vi.fn();
        framework.windowManager.addUpdateListener(tick);
        framework.windowManager.runEventLoop();
        expect(tick).toHaveBeenCalledOnce();

        framework.dispose();
        framework.dispose();
        expect(caf).toHaveBeenCalledExactlyOnceWith(7);
        framework.windowManager.runEventLoop();
        expect(tick).toHaveBeenCalledOnce();
        vi.unstubAllGlobals();
    });
});
