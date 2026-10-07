import { describe, expect, it } from "vitest";
import { KtxTranscodeFormat, VkFormat } from "ris-ktx2-api";
import { TextureFormat, TextureUtilities } from "../src/index.ts";

describe("TextureUtilities", () => {
    it("recognizes the compressed texture formats", () => {
        const compressed = [
            TextureFormat.ASTC_4X4_RGBA,
            TextureFormat.BC3_RGBA_UNORM,
            TextureFormat.BC7_RGBA_UNORM,
            TextureFormat.ETC2_RGBA8_UNORM,
        ];

        for (const format of compressed) {
            expect(TextureUtilities.isCompressedTextureFormat(format)).toBe(true);
        }

        const uncompressed = [
            TextureFormat.UNDEFINED,
            TextureFormat.RGBA_8_UNORM,
            TextureFormat.RGBA_8_UNORM_SRGB,
            TextureFormat.DEPTH_24_STENCIL_8,
            TextureFormat.DEPTH_32_FLOAT,
            TextureFormat.RED_32_FLOAT,
        ];

        for (const format of uncompressed) {
            expect(TextureUtilities.isCompressedTextureFormat(format)).toBe(false);
        }
    });

    it("counts mip levels from the larger dimension", () => {
        expect(TextureUtilities.mipLevels(1, 1)).toBe(1);
        expect(TextureUtilities.mipLevels(2, 1)).toBe(2);
        expect(TextureUtilities.mipLevels(1, 2)).toBe(2);
        expect(TextureUtilities.mipLevels(3, 5)).toBe(3);
        expect(TextureUtilities.mipLevels(100, 50)).toBe(7);
        expect(TextureUtilities.mipLevels(256, 128)).toBe(9);
        expect(TextureUtilities.mipLevels(256, 256)).toBe(9);
    });

    it("sizes uncompressed and block-compressed textures in bytes", () => {
        expect(TextureUtilities.getVRamSize(TextureFormat.RGBA_8_UNORM, 2, 2)).toBe(16);
        expect(TextureUtilities.getVRamSize(TextureFormat.RGBA_8_UNORM_SRGB, 64, 32)).toBe(8192);
        expect(TextureUtilities.getVRamSize(TextureFormat.DEPTH_24_STENCIL_8, 1, 1)).toBe(4);
        expect(TextureUtilities.getVRamSize(TextureFormat.BC7_RGBA_UNORM, 4, 4)).toBe(16);
        expect(TextureUtilities.getVRamSize(TextureFormat.BC7_RGBA_UNORM, 5, 5)).toBe(64);
        expect(TextureUtilities.getVRamSize(TextureFormat.BC3_RGBA_UNORM, 5, 3)).toBe(32);
        expect(TextureUtilities.getVRamSize(TextureFormat.ASTC_4X4_RGBA, 1, 1)).toBe(16);
        expect(TextureUtilities.getVRamSize(TextureFormat.ETC2_RGBA8_UNORM, 8, 4)).toBe(32);
    });

    it("throws when a texture format has no Vulkan layout", () => {
        expect(() => TextureUtilities.getVRamSize(TextureFormat.UNDEFINED, 1, 1))
            .toThrow(`Not implemented: ${TextureFormat.UNDEFINED}`);
        expect(() => TextureUtilities.getVRamSize(TextureFormat.DEPTH_32_FLOAT, 4, 4))
            .toThrow(`Not implemented: ${TextureFormat.DEPTH_32_FLOAT}`);
        expect(() => TextureUtilities.getVRamSize(TextureFormat.RED_32_FLOAT, 4, 4))
            .toThrow(`Not implemented: ${TextureFormat.RED_32_FLOAT}`);
    });

    it("maps the supported Vulkan formats onto texture formats", () => {
        expect(TextureUtilities.convertVkFormatToTextureFormat(VkFormat.R8G8B8A8_UNORM))
            .toBe(TextureFormat.RGBA_8_UNORM);
        expect(TextureUtilities.convertVkFormatToTextureFormat(VkFormat.R8G8B8A8_SRGB))
            .toBe(TextureFormat.RGBA_8_UNORM_SRGB);
        expect(TextureUtilities.convertVkFormatToTextureFormat(VkFormat.BC7_UNORM_BLOCK))
            .toBe(TextureFormat.BC7_RGBA_UNORM);
        expect(TextureUtilities.convertVkFormatToTextureFormat(VkFormat.BC3_UNORM_BLOCK))
            .toBe(TextureFormat.BC3_RGBA_UNORM);
        expect(TextureUtilities.convertVkFormatToTextureFormat(VkFormat.ASTC_4X4_UNORM_BLOCK))
            .toBe(TextureFormat.ASTC_4X4_RGBA);
        expect(TextureUtilities.convertVkFormatToTextureFormat(VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK))
            .toBe(TextureFormat.ETC2_RGBA8_UNORM);

        expect(() => TextureUtilities.convertVkFormatToTextureFormat(VkFormat.R8_UNORM))
            .toThrow(`Not implemented: ${VkFormat.R8_UNORM}`);
        expect(() => TextureUtilities.convertVkFormatToTextureFormat(VkFormat.D24_UNORM_S8_UINT))
            .toThrow(`Not implemented: ${VkFormat.D24_UNORM_S8_UINT}`);
        expect(() => TextureUtilities.convertVkFormatToTextureFormat(VkFormat.ETC2_R8G8B8A8_SRGB_BLOCK))
            .toThrow(`Not implemented: ${VkFormat.ETC2_R8G8B8A8_SRGB_BLOCK}`);
    });

    it("maps texture formats onto KTX transcode targets", () => {
        expect(TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.RGBA_8_UNORM))
            .toBe(KtxTranscodeFormat.RGBA32);
        expect(TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.ASTC_4X4_RGBA))
            .toBe(KtxTranscodeFormat.ASTC_4X4_RGBA);
        expect(TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.BC3_RGBA_UNORM))
            .toBe(KtxTranscodeFormat.BC3_RGBA);
        expect(TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.BC7_RGBA_UNORM))
            .toBe(KtxTranscodeFormat.BC7_RGBA);
        expect(TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.ETC2_RGBA8_UNORM))
            .toBe(KtxTranscodeFormat.ETC2_RGBA);

        expect(() => TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.RGBA_8_UNORM_SRGB))
            .toThrow(`Not implemented: ${TextureFormat.RGBA_8_UNORM_SRGB}`);
        expect(() => TextureUtilities.convertTextureFormatToKtxTranscodeFormat(TextureFormat.DEPTH_24_STENCIL_8))
            .toThrow(`Not implemented: ${TextureFormat.DEPTH_24_STENCIL_8}`);
    });

    it("maps KTX transcode targets onto unsigned normalized Vulkan formats", () => {
        const mapped: Array<[KtxTranscodeFormat, VkFormat]> = [
            [KtxTranscodeFormat.KTX_TTF_ETC1_RGB, VkFormat.ETC2_R8G8B8_UNORM_BLOCK],
            [KtxTranscodeFormat.ETC2_RGBA, VkFormat.ETC2_R8G8B8A8_UNORM_BLOCK],
            [KtxTranscodeFormat.KTX_TTF_BC1_RGB, VkFormat.BC1_RGB_UNORM_BLOCK],
            [KtxTranscodeFormat.BC3_RGBA, VkFormat.BC3_UNORM_BLOCK],
            [KtxTranscodeFormat.KTX_TTF_BC4_R, VkFormat.BC4_UNORM_BLOCK],
            [KtxTranscodeFormat.KTX_TTF_BC5_RG, VkFormat.BC5_UNORM_BLOCK],
            [KtxTranscodeFormat.BC7_RGBA, VkFormat.BC7_UNORM_BLOCK],
            [KtxTranscodeFormat.KTX_TTF_PVRTC1_4_RGB, VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG],
            [KtxTranscodeFormat.KTX_TTF_PVRTC1_4_RGBA, VkFormat.PVRTC1_4BPP_UNORM_BLOCK_IMG],
            [KtxTranscodeFormat.ASTC_4X4_RGBA, VkFormat.ASTC_4X4_UNORM_BLOCK],
            [KtxTranscodeFormat.RGBA32, VkFormat.R8G8B8A8_UNORM],
            [KtxTranscodeFormat.KTX_TTF_RGB565, VkFormat.R5G6B5_UNORM_PACK16],
            [KtxTranscodeFormat.KTX_TTF_BGR565, VkFormat.B5G6R5_UNORM_PACK16],
            [KtxTranscodeFormat.KTX_TTF_RGBA4444, VkFormat.R4G4B4A4_UNORM_PACK16],
            [KtxTranscodeFormat.KTX_TTF_PVRTC2_4_RGB, VkFormat.PVRTC2_4BPP_UNORM_BLOCK_IMG],
            [KtxTranscodeFormat.KTX_TTF_PVRTC2_4_RGBA, VkFormat.PVRTC2_4BPP_UNORM_BLOCK_IMG],
            [KtxTranscodeFormat.KTX_TTF_ETC2_EAC_R11, VkFormat.EAC_R11_UNORM_BLOCK],
            [KtxTranscodeFormat.KTX_TTF_ETC2_EAC_RG11, VkFormat.EAC_R11G11_UNORM_BLOCK],
        ];

        for (const [transcodeFormat, vkFormat] of mapped) {
            expect(TextureUtilities.convertKtxTranscodeFormatToVkFormat(transcodeFormat)).toBe(vkFormat);
        }

        const shared = [
            TextureFormat.RGBA_8_UNORM,
            TextureFormat.ASTC_4X4_RGBA,
            TextureFormat.BC3_RGBA_UNORM,
            TextureFormat.BC7_RGBA_UNORM,
            TextureFormat.ETC2_RGBA8_UNORM,
        ];

        for (const textureFormat of shared) {
            const transcodeFormat = TextureUtilities.convertTextureFormatToKtxTranscodeFormat(textureFormat);
            const vkFormat = TextureUtilities.convertKtxTranscodeFormatToVkFormat(transcodeFormat);
            expect(TextureUtilities.convertVkFormatToTextureFormat(vkFormat)).toBe(textureFormat);
        }

        expect(() => TextureUtilities.convertKtxTranscodeFormatToVkFormat(KtxTranscodeFormat.KTX_TTF_ETC))
            .toThrow(`Not implemented: ${KtxTranscodeFormat.KTX_TTF_ETC}`);
        expect(() => TextureUtilities.convertKtxTranscodeFormatToVkFormat(KtxTranscodeFormat.BC1_OR_3))
            .toThrow(`Not implemented: ${KtxTranscodeFormat.BC1_OR_3}`);
        expect(() => TextureUtilities.convertKtxTranscodeFormatToVkFormat(KtxTranscodeFormat.NO_SELECTION))
            .toThrow(`Not implemented: ${KtxTranscodeFormat.NO_SELECTION}`);
    });
});
