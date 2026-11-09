import {vec2} from "gl-matrix";
import { resolvePrimitiveStateDescriptor } from "../src/core/rendering/primitive/PrimitiveStateDescriptorUtilities.ts";
import { describe, expect, it } from "vitest";
import {
    Color,
    ContentConfig,
    CullMode,
    FrontFace,
    LoadAction,
    MipMapSamplerFilter,
    PrimitiveTopology,
    RenderPassColorAttachment,
    SamplerAddressMode,
    SamplerDescriptor,
    SamplerFilter,
    State,
    StoreAction,
    SurfacePresentMode,
    TextureFormat,
    TextureUsage,
    TextureViewDimension,
    CanvasBounds,
    RenderingBackend,
} from "../src/api/index.ts";
import {ATexture2D} from "../src/api/rendering/texture/ATexture2D.ts";
import {ATextureFactory} from "../src/api/rendering/texture/ATextureFactory.ts";
import type {IFramework, ISwapChainDescriptor, ITexture2D, ITextureDescriptor, ITextureView2D} from "../src/api/index.ts";

/** Minimal device: views supported so defaults tests can exercise the view cache. */
function testGraphicsDevice(supportsTextureView = true) {
    return {
        api: RenderingBackend.WEB_GPU,
        features: {supportsTextureView},
    } as unknown as import("../src/api/index.ts").IGraphicsDevice;
}

/** A texture without a backend, to read the defaults ATexture2D applies. */
class TestTexture extends ATexture2D {
    public initialized = false;
    public constructor(public readonly descriptor: ITextureDescriptor, supportsTextureView = true) {
        super(testGraphicsDevice(supportsTextureView), descriptor);
    }
    public get generateMipMaps(): boolean {
        return this._generateMipMaps;
    }
    public initialize(): void {
        this.initialized = true;
        this._state = State.INITIALIZED;
    }
    public createdViews: TextureFormat[] = [];
    protected _createTextureView(textureFormat: TextureFormat): ITextureView2D {
        this.createdViews.push(textureFormat);
        return {nativeObject: {}, viewFormat: textureFormat, dimension: TextureViewDimension.DIMENSION_2D, dispose: () => {}};
    }
    public dispose(): void {
    }
}

/** A factory without a backend, to read the descriptor ATextureFactory builds. */
class TestTextureFactory extends ATextureFactory {
    public constructor() {
        super({renderer: {preferredTextureFormat: TextureFormat.RGBA8_UNORM_SRGB}} as unknown as IFramework);
    }
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        const texture = new TestTexture(descriptor);
        texture.initialize();
        return texture;
    }
    protected _createAndInitializeTexture2DArray(): never {
        throw new Error("Not implemented.");
    }
}

describe("value defaults", () => {
    it("uses an 800 by 600 window when bounds are omitted", () => {
        const bounds = new CanvasBounds();

        expect(bounds.width).toBe(800);
        expect(bounds.height).toBe(600);
        expect(new CanvasBounds(1280, 720).width).toBe(1280);
        expect(new CanvasBounds(1280, 720).height).toBe(720);
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

    it("defaults a texture to a shader-readable copy destination without mipmaps or label", () => {
        const texture = new TestTexture({width: 2, height: 3, textureFormat: TextureFormat.RGBA8_UNORM});

        expect(Array.from(texture.size)).toEqual([2, 3]);
        expect(texture.textureFormat).toBe(TextureFormat.RGBA8_UNORM);
        expect(texture.textureUsage).toBe(TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST);
        expect(texture.textureUsage & TextureUsage.RENDER_ATTACHMENT).toBe(0);
        expect(texture.generateMipMaps).toBe(false);
        expect(texture.label).toBeUndefined();
        expect(texture.mipLevels).toBe(1);
    });

    it("keeps given texture descriptor fields", () => {
        const texture = new TestTexture({
            width: 4, height: 4, textureFormat: TextureFormat.RGBA8_UNORM,
            textureUsage: TextureUsage.RENDER_ATTACHMENT, generateMipmaps: true, label: "t",
        });

        expect(texture.textureUsage).toBe(TextureUsage.RENDER_ATTACHMENT);
        expect(texture.generateMipMaps).toBe(true);
        expect(texture.label).toBe("t");
    });

    it("rejects a texture without size or format", () => {
        expect(() => new TestTexture({textureFormat: TextureFormat.RGBA8_UNORM})).toThrow();
        expect(() => new TestTexture({width: 1, height: 1})).toThrow();
    });

    it("fills factory defaults: preferred format, copy destination usage, no mipmaps", () => {
        const factory = new TestTextureFactory();
        const texture = factory.createEmpty(vec2.fromValues(8, 8)) as TestTexture;

        expect(texture.descriptor.textureFormat).toBe(TextureFormat.RGBA8_UNORM_SRGB);
        expect(texture.descriptor.textureUsage).toBe(TextureUsage.COPY_DST | TextureUsage.TEXTURE_BINDING);
        expect(texture.descriptor.generateMipmaps).toBe(false);
        expect(texture.descriptor.label).toBeUndefined();
        expect(texture.descriptor.data).toBeUndefined();
        expect(texture.initialized).toBe(true);
    });

    it("passes pixel data to the backend texture as one Uint8Array level", () => {
        const factory = new TestTextureFactory();
        const texture = factory.create(1, 1, [1, 2, 3, 4], 4, "px", undefined, TextureFormat.RGBA8_UNORM) as TestTexture;

        expect(texture.descriptor.textureFormat).toBe(TextureFormat.RGBA8_UNORM);
        expect(texture.descriptor.label).toBe("px");
        const data = texture.descriptor.data as Uint8Array[];
        expect(data).toHaveLength(1);
        expect(Array.from(data[0])).toEqual([1, 2, 3, 4]);
    });

    it("defaults view formats to the texture format and caches one view per view format", () => {
        const plain = new TestTexture({width: 1, height: 1, textureFormat: TextureFormat.RGBA8_UNORM});
        expect(plain.viewFormats).toEqual([TextureFormat.RGBA8_UNORM]);

        const texture = new TestTexture({
            width: 1, height: 1, textureFormat: TextureFormat.RGBA8_UNORM,
            viewFormats: [TextureFormat.RGBA8_UNORM_SRGB, TextureFormat.RGBA8_UNORM],
        });
        expect(texture.viewFormats).toEqual([TextureFormat.RGBA8_UNORM, TextureFormat.RGBA8_UNORM_SRGB]);
        expect(() => texture.getTextureView(TextureFormat.RGBA8_UNORM)).toThrow(/initialized/);

        texture.initialize();
        const srgb = texture.getTextureView(TextureFormat.RGBA8_UNORM_SRGB);
        expect(srgb.viewFormat).toBe(TextureFormat.RGBA8_UNORM_SRGB);
        expect(srgb.dimension).toBe(TextureViewDimension.DIMENSION_2D);
        expect(texture.getTextureView(TextureFormat.RGBA8_UNORM_SRGB)).toBe(srgb);
        expect(texture.defaultTextureView).toBe(texture.getTextureView(TextureFormat.RGBA8_UNORM));
        expect(texture.createdViews).toEqual([TextureFormat.RGBA8_UNORM_SRGB, TextureFormat.RGBA8_UNORM]);
        expect(() => texture.getTextureView(TextureFormat.R32_FLOAT)).toThrow(/not in viewFormats/);
    });

    it("rejects viewFormats when the device does not support texture views", () => {
        expect(() => new TestTexture({
            width: 1, height: 1, textureFormat: TextureFormat.RGBA8_UNORM,
            viewFormats: [TextureFormat.RGBA8_UNORM_SRGB],
        }, false)).toThrow(/supportsTextureView is false/);
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
        const descriptor = resolvePrimitiveStateDescriptor();

        expect(descriptor.topology).toBe(PrimitiveTopology.TRIANGLE_LIST);
        expect(descriptor.cullFace).toBe(CullMode.BACK);
        expect(descriptor.frontFace).toBe(FrontFace.CCW);
    });

    it("keeps the given primitive state fields and fills in the rest", () => {
        const descriptor = resolvePrimitiveStateDescriptor({ cullFace: CullMode.NONE });

        expect(descriptor.topology).toBe(PrimitiveTopology.TRIANGLE_LIST);
        expect(descriptor.cullFace).toBe(CullMode.NONE);
        expect(descriptor.frontFace).toBe(FrontFace.CCW);
    });

    it("clears a color attachment to black and stores the result", () => {
        const attachment = new RenderPassColorAttachment();

        expect(attachment.loadAction).toBe(LoadAction.CLEAR);
        expect(attachment.storeAction).toBe(StoreAction.STORE);
        expect(attachment.clearColor.equals(Color.transparent())).toBe(true);
        expect(attachment.texture).toBeUndefined();
        expect(attachment.view).toBeUndefined();
    });

    it("leaves every swap chain descriptor field optional", () => {
        const descriptor: ISwapChainDescriptor = {};

        expect(descriptor.width ?? 0).toBe(0);
        expect(descriptor.height ?? 0).toBe(0);
        expect(descriptor.desiredPresentationMode ?? SurfacePresentMode.FIFO).toBe(SurfacePresentMode.FIFO);
    });
});
