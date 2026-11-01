import { describe, expect, it, vi } from "vitest";
import { Framework } from "../src/Framework.ts";
import { type IFrameworkConfiguration, TextureFormat } from "../src/api/index.ts";
import { ColorSpace } from "../src/api/rendering/enums.ts";

function createFramework(textureColorSpace?: ColorSpace) {
    const canvas = { addEventListener: vi.fn(), style: {}, width: 800, height: 600 } as unknown as HTMLCanvasElement;
    const config: IFrameworkConfiguration = { canvas, textureColorSpace };
    return new Framework(config);
}

describe("renderer.colorSpace", () => {
    it("starts from the configuration and preferredTextureFormat follows a switch", () => {
        const framework = createFramework(ColorSpace.LINEAR);
        expect(framework.renderer.colorSpace).toBe(ColorSpace.LINEAR);
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA_8_UNORM);

        framework.renderer.colorSpace = ColorSpace.SRGB;
        expect(framework.renderer.colorSpace).toBe(ColorSpace.SRGB);
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA_8_UNORM_SRGB);

        framework.renderer.colorSpace = ColorSpace.LINEAR;
        expect(framework.renderer.preferredTextureFormat).toBe(TextureFormat.RGBA_8_UNORM);
    });
});
