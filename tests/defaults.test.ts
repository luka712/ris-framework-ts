import { describe, expect, it } from "vitest";
import {
    Color,
    ContentConfig,
    CullMode,
    FrontFace,
    LoadAction,
    MipMapSamplerFilter,
    PrimitiveStateDescriptor,
    PrimitiveTopology,
    RenderPassColorAttachment,
    SamplerAddressMode,
    SamplerDescriptor,
    SamplerFilter,
    State,
    StoreAction,
    SurfacePresentMode,
    SwapChainDescriptor,
    TextureDescriptor,
    TextureFormat,
    TextureUsage,
    TextureViewDescriptor,
    TextureViewDimension,
    WindowBounds,
} from "../src/api/index.ts";

describe("value defaults", () => {
    it("uses an 800 by 600 window when bounds are omitted", () => {
        const bounds = new WindowBounds();

        expect(bounds.width).toBe(800);
        expect(bounds.height).toBe(600);
        expect(new WindowBounds(1280, 720).width).toBe(1280);
        expect(new WindowBounds(1280, 720).height).toBe(720);
    });

    it("orders resource state from created through disposed", () => {
        expect(State.CREATED).toBe(0);
        expect(State.INITIALIZED).toBe(1);
        expect(State.DISPOSING).toBe(2);
        expect(State.DISPOSED).toBe(3);
    });

    it("leaves content uncached until asked", () => {
        expect(new ContentConfig().keepDataCached).toBe(false);
    });

    it("defaults a texture to an undefined shader-readable copy destination", () => {
        const descriptor = new TextureDescriptor();

        expect(descriptor.width).toBe(0);
        expect(descriptor.height).toBe(0);
        expect(descriptor.textureFormat).toBe(TextureFormat.UNDEFINED);
        expect(descriptor.generateMipmaps).toBe(false);
        expect(descriptor.label).toBeNull();
        expect(descriptor.textureUsage & TextureUsage.TEXTURE_BINDING).toBe(TextureUsage.TEXTURE_BINDING);
        expect(descriptor.textureUsage & TextureUsage.COPY_DST).toBe(TextureUsage.COPY_DST);
        expect(descriptor.textureUsage & TextureUsage.RENDER_ATTACHMENT).toBe(0);
        expect(descriptor.textureUsage).toBe(TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST);
    });

    it("defaults a 2D texture view to RGBA8", () => {
        const descriptor = new TextureViewDescriptor();

        expect(descriptor.dimension).toBe(TextureViewDimension.DIMENSION_2D);
        expect(descriptor.textureFormat).toBe(TextureFormat.RGBA_8_UNORM);
        expect(descriptor.label).toBeUndefined();
    });

    it("defaults a sampler to repeating linear filtering without mip filtering", () => {
        const descriptor = new SamplerDescriptor();

        expect(descriptor.addressModeU).toBe(SamplerAddressMode.REPEAT);
        expect(descriptor.addressModeV).toBe(SamplerAddressMode.REPEAT);
        expect(descriptor.addressModeW).toBe(SamplerAddressMode.REPEAT);
        expect(descriptor.minFilter).toBe(SamplerFilter.LINEAR);
        expect(descriptor.magFilter).toBe(SamplerFilter.LINEAR);
        expect(descriptor.mipMapFilter).toBe(MipMapSamplerFilter.NONE);
    });

    it("defaults primitive state to back-face culled counter-clockwise triangles", () => {
        const descriptor = new PrimitiveStateDescriptor();

        expect(descriptor.topology).toBe(PrimitiveTopology.TRIANGLE_LIST);
        expect(descriptor.cullFace).toBe(CullMode.BACK);
        expect(descriptor.frontFace).toBe(FrontFace.CCW);
    });

    it("clears a color attachment to black and stores the result", () => {
        const attachment = new RenderPassColorAttachment();

        expect(attachment.loadAction).toBe(LoadAction.CLEAR);
        expect(attachment.storeAction).toBe(StoreAction.STORE);
        expect(attachment.clearColor.equals(Color.black())).toBe(true);
        expect(attachment.texture).toBeUndefined();
        expect(attachment.view).toBeUndefined();
    });

    it("defaults a swap chain to zero-sized FIFO presentation", () => {
        const descriptor = new SwapChainDescriptor();

        expect(descriptor.width).toBe(0);
        expect(descriptor.height).toBe(0);
        expect(descriptor.desiredPresentationMode).toBe(SurfacePresentMode.FIFO);
    });
});
