import { describe, expect, it } from "vitest";
import { VkFormat } from "ris-ktx2";
import { TextureFormat, TextureUtilities } from "../src/api/index.ts";
import { WebGlConverter } from "../src/webgl/utilities/WebGlConverter.ts";
import { WebGpuConverter } from "../src/webgpu/utilities/WebGpuConverter.ts";
import { WebGLGraphicsDeviceFeatures } from "../src/webgl/WebGLGraphicsDeviceFeatures.ts";
import { WebGpuGraphicsDeviceFeatures } from "../src/webgpu/WebGpuGraphicsDeviceFeatures.ts";

const gl = {} as WebGL2RenderingContext;

describe("sRGB compressed formats", () => {
    it("maps formats to WebGL internal formats", () => {
        const expected: [TextureFormat, number][] = [
            [TextureFormat.BC7_RGBA_UNORM, 0x8E8C],
            [TextureFormat.BC7_RGBA_SRGB, 0x8E8D],
            [TextureFormat.BC3_RGBA_UNORM, 0x83F3],
            [TextureFormat.BC3_RGBA_SRGB, 0x8C4F],
            [TextureFormat.BC1_RGB_UNORM, 0x83F0],
            [TextureFormat.BC1_RGB_SRGB, 0x8C4C],
            [TextureFormat.ETC2_RGBA8_UNORM, 0x9278],
            [TextureFormat.ETC2_RGBA8_SRGB, 0x9279],
            [TextureFormat.ETC2_RGB8_UNORM, 0x9274],
            [TextureFormat.ETC2_RGB8_SRGB, 0x9275],
            [TextureFormat.ASTC_4X4_RGBA_SRGB, 0x93D0],
        ];
        for (const [format, glFormat] of expected) {
            expect(WebGlConverter.convertInternalFormat(gl, format)).toBe(glFormat);
        }
    });

    it("maps formats to WebGPU formats", () => {
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.BC7_RGBA_SRGB)).toBe("bc7-rgba-unorm-srgb");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.BC3_RGBA_UNORM)).toBe("bc3-rgba-unorm");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.BC3_RGBA_SRGB)).toBe("bc3-rgba-unorm-srgb");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.ETC2_RGBA8_SRGB)).toBe("etc2-rgba8unorm-srgb");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.ETC2_RGB8_UNORM)).toBe("etc2-rgb8unorm");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.ASTC_4X4_RGBA_UNORM)).toBe("astc-4x4-unorm");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.ASTC_12X12_RGBA_SRGB)).toBe("astc-12x12-unorm-srgb");
        expect(WebGpuConverter.convertTextureFormat(TextureFormat.ASTC_10X5_RGBA_SRGB)).toBe("astc-10x5-unorm-srgb");
    });

    it("converts sRGB vkFormats to sRGB texture formats", () => {
        const expected: [VkFormat, TextureFormat][] = [
            [VkFormat.BC7_UNORM_BLOCK, TextureFormat.BC7_RGBA_UNORM],
            [VkFormat.BC7_SRGB_BLOCK, TextureFormat.BC7_RGBA_SRGB],
            [VkFormat.BC3_SRGB_BLOCK, TextureFormat.BC3_RGBA_SRGB],
            [VkFormat.BC1_RGB_SRGB_BLOCK, TextureFormat.BC1_RGB_SRGB],
            [VkFormat.ETC2_R8G8B8A8_SRGB_BLOCK, TextureFormat.ETC2_RGBA8_SRGB],
            [VkFormat.ETC2_R8G8B8_UNORM_BLOCK, TextureFormat.ETC2_RGB8_UNORM],
            [VkFormat.ETC2_R8G8B8_SRGB_BLOCK, TextureFormat.ETC2_RGB8_SRGB],
            [VkFormat.ASTC_4X4_SRGB_BLOCK, TextureFormat.ASTC_4X4_RGBA_SRGB],
        ];
        for (const [vk, format] of expected) {
            expect(TextureUtilities.convertVkFormatToTextureFormat(vk)).toBe(format);
        }
    });

    it("finds sRGB/linear variants and block sizes", () => {
        expect(TextureUtilities.toSrgbFormat(TextureFormat.BC7_RGBA_UNORM)).toBe(TextureFormat.BC7_RGBA_SRGB);
        expect(TextureUtilities.toSrgbFormat(TextureFormat.PVRTC_4BPPV1_RGBA)).toBe(TextureFormat.PVRTC_4BPPV1_RGBA);
        expect(TextureUtilities.toLinearFormat(TextureFormat.BC3_RGBA_SRGB)).toBe(TextureFormat.BC3_RGBA_UNORM);
        expect(TextureUtilities.isSrgbFormat(TextureFormat.ETC2_RGB8_SRGB)).toBe(true);
        expect(TextureUtilities.isCompressedTextureFormat(TextureFormat.BC7_RGBA_SRGB)).toBe(true);
        expect(TextureUtilities.getBlockSize(TextureFormat.ASTC_10X8_RGBA_SRGB)).toEqual([10, 8]);
        expect(TextureUtilities.getBlockSize(TextureFormat.BC1_RGB_SRGB)).toEqual([4, 4]);
        expect(TextureUtilities.getBlockSize(TextureFormat.RGBA_8_UNORM)).toEqual([1, 1]);
    });
});

describe("compression feature flags", () => {
    const webgl = (extensions: string[]) => ({
        getExtension: (name: string) => (extensions.includes(name) ? {} : null),
    }) as unknown as WebGL2RenderingContext;

    it("WebGL: BPTC sets BC, S3TC sets S3TC", () => {
        const bptcOnly = new WebGLGraphicsDeviceFeatures(webgl(["EXT_texture_compression_bptc"]));
        expect(bptcOnly.supportsTextureCompressionBC).toBe(true);
        expect(bptcOnly.supportsTextureCompressionS3TC).toBe(false);

        const s3tcOnly = new WebGLGraphicsDeviceFeatures(webgl(["WEBGL_compressed_texture_s3tc"]));
        expect(s3tcOnly.supportsTextureCompressionBC).toBe(false);
        expect(s3tcOnly.supportsTextureCompressionS3TC).toBe(true);
        expect(s3tcOnly.supportsTextureCompressionS3TCSrgb).toBe(false);

        const s3tcSrgb = new WebGLGraphicsDeviceFeatures(webgl(["WEBGL_compressed_texture_s3tc", "WEBGL_compressed_texture_s3tc_srgb"]));
        expect(s3tcSrgb.supportsTextureCompressionS3TCSrgb).toBe(true);
    });

    it("WebGPU: texture-compression-bc covers BC, S3TC and S3TC sRGB", () => {
        const features = new WebGpuGraphicsDeviceFeatures(new Set(["texture-compression-bc"]) as never);
        expect(features.supportsTextureCompressionBC).toBe(true);
        expect(features.supportsTextureCompressionS3TC).toBe(true);
        expect(features.supportsTextureCompressionS3TCSrgb).toBe(true);
        expect(features.supportsTextureCompressionETC2).toBe(false);
    });
});
