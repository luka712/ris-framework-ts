import {describe, expect, it} from "vitest";
import {TextureFormat} from "../src/api/rendering/texture/TextureFormat";
import {WebGlGraphicsDeviceFeatures} from "../src/webgl/WebGLGraphicsDeviceFeatures";
import {WebGpuGraphicsDeviceFeatures} from "../src/webgpu/WebGpuGraphicsDeviceFeatures";

const webgl = (extensions: string[]) => ({
    getExtension: (name: string) => (extensions.includes(name) ? {} : null),
}) as unknown as WebGL2RenderingContext;

describe("graphics device features", () => {
    it("WebGL: always supports the uncompressed base formats", () => {
        const features = new WebGlGraphicsDeviceFeatures(webgl([]));
        expect(features.supportsTextureFormat(TextureFormat.RGBA8_UNORM)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.RGBA8_UNORM_SRGB)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.DEPTH24_PLUS_STENCIL8)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.ASTC_4X4_UNORM)).toBe(false);
        expect(features.supportsTextureFormat(TextureFormat.R32_FLOAT)).toBe(false);
        expect(features.supportsTextureView).toBe(false);
    });

    it("WebGL: ASTC extension enables all ASTC block sizes, linear and sRGB", () => {
        const features = new WebGlGraphicsDeviceFeatures(webgl(["WEBGL_compressed_texture_astc"]));
        expect(features.supportsTextureFormat(TextureFormat.ASTC_10X5_UNORM)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.ASTC_12X12_UNORM_SRGB)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.BC7_RGBA_UNORM)).toBe(false);
    });

    it("WebGL: S3TC sRGB formats need the s3tc_srgb extension", () => {
        const s3tc = new WebGlGraphicsDeviceFeatures(webgl(["WEBGL_compressed_texture_s3tc"]));
        expect(s3tc.supportsTextureFormat(TextureFormat.BC3_RGBA_UNORM)).toBe(true);
        expect(s3tc.supportsTextureFormat(TextureFormat.BC3_RGBA_UNORM_SRGB)).toBe(false);
    });

    it("WebGPU: BC enables S3TC and BC7, and is listed as a required device feature", () => {
        const features = new WebGpuGraphicsDeviceFeatures(new Set(["texture-compression-bc"]) as never);
        expect(features.supportsTextureFormat(TextureFormat.BC1_RGB_UNORM_SRGB)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.BC7_RGBA_UNORM_SRGB)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.ETC2_RGBA8_UNORM)).toBe(false);
        expect(features.supportsTextureFormat(TextureFormat.R32_FLOAT)).toBe(true);
        expect(features.deviceRequiredFeatures).toEqual(["texture-compression-bc"]);
        expect(features.supportsTextureCompressionPVRTC).toBe(false);
        expect(features.supportsTextureView).toBe(true);
    });

    it("WebGPU: ASTC and ETC2 features", () => {
        const features = new WebGpuGraphicsDeviceFeatures(new Set(["texture-compression-astc", "texture-compression-etc2"]) as never);
        expect(features.supportsTextureFormat(TextureFormat.ASTC_10X5_UNORM_SRGB)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.ETC2_RGB8_UNORM_SRGB)).toBe(true);
        expect(features.supportsTextureFormat(TextureFormat.BC7_RGBA_UNORM)).toBe(false);
        expect(features.deviceRequiredFeatures).toEqual(["texture-compression-etc2", "texture-compression-astc"]);
    });
});

describe("supportsTextureView", () => {
    it("WebGL reports false and WebGPU reports true", () => {
        expect(new WebGlGraphicsDeviceFeatures(webgl([])).supportsTextureView).toBe(false);
        expect(new WebGpuGraphicsDeviceFeatures(new Set() as never).supportsTextureView).toBe(true);
    });
});
