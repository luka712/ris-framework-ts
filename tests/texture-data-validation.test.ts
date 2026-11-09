import { describe, expect, it } from "vitest";
import { VkFormat, KtxDFTransfer, type IKtx2Texture } from "ris-ktx2";
import { TextureFormat } from "../src/api/index.ts";
import { ATextureFactory } from "../src/api/rendering/texture/ATextureFactory.ts";
import type { ITextureDescriptor } from "../src/api/rendering/texture/ITextureDescriptor.ts";
import type { ITexture2D } from "../src/api/rendering/texture/ITexture2D.ts";
import type { ITexture2DArray } from "../src/api/rendering/texture/ITexture2DArray.ts";
// WebGlUtilities first: importing WebGlTextureUtilities directly hits the WebGlUtilities import cycle.
import { WebGlUtilities } from "../src/webgl/utilities/WebGlUtilities.ts";
import { GlslShaderModuleContent } from "../src/api/content/ShaderModuleContent.ts";
import WebGlShaderModule from "../src/webgl/shader/WebGlShaderModule.ts";

/** Records the descriptors ATextureFactory builds, without a backend. */
class RecordingFactory extends ATextureFactory {
    public last: ITextureDescriptor | null = null;
    public constructor() {
        super({
            renderer: { preferredTextureFormat: TextureFormat.RGBA8_UNORM },
            graphicsDevice: {
                api: "test",
                features: {
                    supportsTextureCompressionBC: false,
                    supportsTextureCompressionASTC: false,
                    supportsTextureCompressionS3TC: false,
                    supportsTextureCompressionETC2: false,
                    supportsTextureCompressionPVRTC: false,
                    supportsTextureFormat: () => true,
                },
            },
        } as never);
    }
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        this.last = descriptor;
        return {} as ITexture2D;
    }
    protected _createAndInitializeTexture2DArray(descriptor: ITextureDescriptor): ITexture2DArray {
        this.last = descriptor;
        return {} as ITexture2DArray;
    }
}

const rgba = (w: number, h: number) => new Uint8Array(w * h * 4);

describe("ATextureFactory.create data length", () => {
    it("rejects pixel data shorter than width * height * bytesPerPixel", () => {
        const f = new RecordingFactory();
        expect(() => f.create(2, 2, new Uint8Array(15), 4, "short", undefined, TextureFormat.RGBA8_UNORM))
            .toThrow("ATextureFactory.create: 'short' has 15 bytes of data; 2x2 RGBA8_UNORM needs at least 16 (4 bytes per pixel).");
        expect(() => f.create(2, 2, [1, 2, 3], 4, "arr", undefined, TextureFormat.RGBA8_UNORM)).toThrow("needs at least 16");
    });

    it("accepts exact and longer data, and skips compressed formats", () => {
        const f = new RecordingFactory();
        expect(() => f.create(2, 2, rgba(2, 2), 4, "ok", undefined, TextureFormat.RGBA8_UNORM)).not.toThrow();
        expect(() => f.create(2, 2, new Uint8Array(32), 4, "long", undefined, TextureFormat.RGBA8_UNORM)).not.toThrow();
        expect(() => f.create(4, 4, new Uint8Array(1), 4, "bc7", undefined, TextureFormat.BC7_RGBA_UNORM)).not.toThrow();
    });
});

describe("ATextureFactory.createTexture2DArray data", () => {
    it("rejects more layer entries than layers, allows fewer", () => {
        const f = new RecordingFactory();
        expect(() => f.createTexture2DArray(2, 2, 1, [[rgba(2, 2)], [rgba(2, 2)]], "extra"))
            .toThrow("ATextureFactory.createTexture2DArray: 'extra' has data for 2 layers, but the texture array has 1 layers.");
        expect(() => f.createTexture2DArray(2, 2, 3, [[rgba(2, 2)]], "fewer")).not.toThrow();
        expect(f.last!.layers).toBe(3);
    });

    it("checks every mip level of every layer", () => {
        const f = new RecordingFactory();
        expect(() => f.createTexture2DArray(2, 2, 2, [[rgba(2, 2)], [new Uint8Array(8)]], "l1"))
            .toThrow("'l1' layer 1 mip 0 has 8 bytes of data; 2x2 RGBA8_UNORM needs at least 16");
        expect(() => f.createTexture2DArray(4, 4, 1, [[rgba(4, 4), new Uint8Array(3)]], "m1"))
            .toThrow("'m1' layer 0 mip 1 has 3 bytes of data; 2x2 RGBA8_UNORM needs at least 16");
        expect(() => f.createTexture2DArray(4, 4, 1, [[rgba(4, 4), rgba(2, 2), rgba(1, 1)]], "ok")).not.toThrow();
    });
});

describe("ATextureFactory.createTexture2DArrayFromKtx2", () => {
    it("builds one layer per KTX2 layer with all mip levels", () => {
        const f = new RecordingFactory();
        const calls: [number, number][] = [];
        const ktx = {
            oetf: KtxDFTransfer.LINEAR, vkFormat: VkFormat.R8G8B8A8_UNORM, needsTranscoding: false,
            numLevels: 2, width: 4, height: 4, filePath: "a.ktx2",
            getTextureFormatInfo: () => ({ blockWidth: 1, blockHeight: 1 }),
            getImage: (level: number, layer: number) => { calls.push([level, layer]); return rgba(4 >> level, 4 >> level); },
        } as unknown as IKtx2Texture;

        f.createTexture2DArrayFromKtx2(ktx, 3);
        expect(f.last!.layers).toBe(3);
        expect(f.last!.dataArray!.length).toBe(3);
        expect(f.last!.dataArray!.every(l => l.length == 2)).toBe(true);
        expect(f.last!.textureFormat).toBe(TextureFormat.RGBA8_UNORM);
        expect(f.last!.label).toBe("a.ktx2");
        expect(calls).toContainEqual([1, 2]);
        expect(() => f.createTexture2DArrayFromKtx2(ktx, 0)).toThrow("has 0 layers");
    });
});

describe("WebGlTextureUtilities.createTexture2DArray", () => {
    it("rejects more layer entries than layers before touching GL", () => {
        const utilities = WebGlUtilities.texture;
        expect(() => utilities.createTexture2DArray({} as WebGL2RenderingContext, 1, 1, 1,
            [[new Uint8Array(4)], [new Uint8Array(4)]], TextureFormat.RGBA8_UNORM, false, 1, "gl"))
            .toThrow("WebGlTextureUtilities.createTexture2DArray: 'gl' has data for 2 layers, but the texture array has 1 layers.");
    });
});

describe("WebGlShaderModule includes", () => {
    it("caches modules on the instance and leaves the registry untouched", () => {
        const before = JSON.stringify(Object.keys(GlslShaderModuleContent).map(id => Object.keys(GlslShaderModuleContent[id])));
        const fake = { _modules: {} as Record<string, unknown> };
        const load = (WebGlShaderModule.prototype as unknown as { _loadModule(path: string): string })._loadModule;
        const source = load.call(fake, "modules/color_conversion.glsl");
        expect(source).toBe(GlslShaderModuleContent.color_conversion.shader);
        expect(Object.keys(fake._modules)).toEqual(["modules/color_conversion.glsl"]);
        expect(JSON.stringify(Object.keys(GlslShaderModuleContent).map(id => Object.keys(GlslShaderModuleContent[id])))).toBe(before);
        expect(() => load.call(fake, "modules/missing.glsl")).toThrow('#include "modules/missing.glsl" not found');
    });
});
