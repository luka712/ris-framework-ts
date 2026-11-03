import { describe, expect, it } from "vitest";
import { KtxDFTransfer, VkFormat, type IKtx2Texture } from "ris-ktx2";
import { ColorSpace, TextureFormat } from "../src/api/index.ts";
import { ATextureFactory } from "../src/api/rendering/texture/ATextureFactory.ts";
import type { ITextureDescriptor } from "../src/api/rendering/texture/ITextureDescriptor.ts";
import type { ITexture2D } from "../src/api/rendering/texture/ITexture2D.ts";

class TestFactory extends ATextureFactory {
    public last: ITextureDescriptor | null = null;
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        this.last = descriptor;
        return {} as ITexture2D;
    }
}

function createFactory(rendererColorSpace = ColorSpace.LINEAR, bc = true) {
    const framework = {
        renderer: { colorSpace: rendererColorSpace },
        graphicsDevice: {
            features: {
                supportsTextureCompressionBC: bc,
                supportsTextureCompressionASTC: false,
                supportsTextureCompressionS3TC: false,
                supportsTextureCompressionETC2: false,
                supportsTextureCompressionPVRTC: false,
                supportsTextureFormat: () => true,
            },
        },
    };
    return new TestFactory(framework as any);
}

function ktx(oetf: KtxDFTransfer, vkFormat: VkFormat, needsTranscoding: boolean): IKtx2Texture {
    return {
        oetf, vkFormat, needsTranscoding,
        numLevels: 1, width: 4, height: 4, filePath: "test.ktx2",
        transcodeBasis: () => undefined,
        getTextureFormatInfo: () => ({ blockWidth: 4, blockHeight: 4, bytesPerBlock: 16 }),
        getImage: () => new Uint8Array(16),
    } as unknown as IKtx2Texture;
}

describe("createFromKtx2 follows the file's color space", () => {
    it("transcoded: sRGB-flagged file gives an sRGB format, linear-flagged a linear one", () => {
        const f = createFactory(ColorSpace.LINEAR);
        f.createFromKtx2(ktx(KtxDFTransfer.SRGB, VkFormat.UNDEFINED, true));
        expect(f.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_SRGB);

        const g = createFactory(ColorSpace.SRGB);
        g.createFromKtx2(ktx(KtxDFTransfer.LINEAR, VkFormat.UNDEFINED, true));
        expect(g.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_UNORM);
    });

    it("non-transcoded: the DFD transfer function picks the variant", () => {
        const f = createFactory(ColorSpace.LINEAR);
        f.createFromKtx2(ktx(KtxDFTransfer.SRGB, VkFormat.BC7_UNORM_BLOCK, false));
        expect(f.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_SRGB);

        const g = createFactory(ColorSpace.SRGB);
        g.createFromKtx2(ktx(KtxDFTransfer.LINEAR, VkFormat.BC7_SRGB_BLOCK, false));
        expect(g.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_UNORM);
    });

    it("non-transcoded with unspecified transfer keeps the file's vkFormat", () => {
        const f = createFactory(ColorSpace.LINEAR);
        f.createFromKtx2(ktx(KtxDFTransfer.UNSPECIFIED, VkFormat.BC7_SRGB_BLOCK, false));
        expect(f.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_SRGB);
    });

    it("an explicit color space overrides the file", () => {
        const f = createFactory();
        f.createFromKtx2(ktx(KtxDFTransfer.SRGB, VkFormat.UNDEFINED, true), TextureFormat.UNDEFINED, ColorSpace.LINEAR);
        expect(f.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_UNORM);

        f.createFromKtx2(ktx(KtxDFTransfer.LINEAR, VkFormat.BC7_UNORM_BLOCK, false), TextureFormat.UNDEFINED, ColorSpace.SRGB);
        expect(f.last!.textureFormat).toBe(TextureFormat.BC7_RGBA_SRGB);
    });

    it("throws when the final format is unsupported", () => {
        const f = createFactory();
        (f as any)._framework.graphicsDevice.features.supportsTextureFormat = () => false;
        expect(() => f.createFromKtx2(ktx(KtxDFTransfer.SRGB, VkFormat.UNDEFINED, true))).toThrow();
    });
});
