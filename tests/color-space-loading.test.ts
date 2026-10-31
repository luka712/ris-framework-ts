import { describe, expect, it, vi } from "vitest";
import { ContentManager } from "../src/api/content/ContentManager.ts";
import { ColorSpace, TextureFormat, TextureUtilities } from "../src/index.ts";
import type { IFramework, IShaderModuleLoader } from "../src/api/index.ts";

function fakeFramework() {
    const renderer = {
        colorSpace: ColorSpace.LINEAR,
        get preferredTextureFormat() {
            return this.colorSpace == ColorSpace.SRGB ? TextureFormat.RGBA_8_UNORM_SRGB : TextureFormat.RGBA_8_UNORM;
        },
    };
    const create = vi.fn(() => ({}));
    const framework = {
        renderer,
        imageLoader: { loadAsync: vi.fn(async () => ({ baseWidth: 1, baseHeight: 1, channels: 4, getData: () => new Uint8Array(4) })) },
        textureFactory: { create },
    } as unknown as IFramework;
    return { framework, renderer, create };
}

describe("color space when loading images", () => {
    it("exports ColorSpace from the package entry", () => {
        expect(ColorSpace.SRGB).toBe("SRGB");
    });

    it("follows renderer.colorSpace at load time, then the descriptor, then an explicit format", async () => {
        const { framework, renderer, create } = fakeFramework();
        const content = new ContentManager(framework, {} as IShaderModuleLoader);
        const formatOf = (i: number) => (create.mock.calls[i] as unknown[])[6];

        await content.loadTexture2DAsync("a.png");
        expect(formatOf(0)).toBe(TextureFormat.RGBA_8_UNORM);

        renderer.colorSpace = ColorSpace.SRGB;
        await content.loadTexture2DAsync("b.png");
        expect(formatOf(1)).toBe(TextureFormat.RGBA_8_UNORM_SRGB);

        await content.loadTexture2DAsync("c.png", { preferredColorSpace: ColorSpace.LINEAR });
        expect(formatOf(2)).toBe(TextureFormat.RGBA_8_UNORM);

        await content.loadTexture2DAsync("d.png", { preferredColorSpace: ColorSpace.LINEAR, textureFormat: TextureFormat.RGBA_8_UNORM_SRGB });
        expect(formatOf(3)).toBe(TextureFormat.RGBA_8_UNORM_SRGB);
    });
});

describe("TextureUtilities.resolveExplicitFormat", () => {
    it("allows the file's format and its sRGB/linear variant", () => {
        expect(TextureUtilities.resolveExplicitFormat(TextureFormat.RGBA_8_UNORM, TextureFormat.RGBA_8_UNORM_SRGB)).toBe(TextureFormat.RGBA_8_UNORM_SRGB);
        expect(TextureUtilities.resolveExplicitFormat(TextureFormat.ASTC_4X4_RGBA_SRGB, TextureFormat.ASTC_4X4_RGBA_UNORM)).toBe(TextureFormat.ASTC_4X4_RGBA_UNORM);
        expect(TextureUtilities.resolveExplicitFormat(TextureFormat.BC7_RGBA_UNORM, TextureFormat.BC7_RGBA_UNORM)).toBe(TextureFormat.BC7_RGBA_UNORM);
    });

    it("throws for a format the data cannot be reinterpreted as", () => {
        expect(() => TextureUtilities.resolveExplicitFormat(TextureFormat.RGBA_8_UNORM, TextureFormat.BC7_RGBA_UNORM)).toThrow(/not compatible/);
    });
});
