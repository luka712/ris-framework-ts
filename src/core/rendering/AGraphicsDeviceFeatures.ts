import {
    ASTC_TEXTURE_FORMATS,
    type IGraphicsDeviceFeatures,
    TextureFormat,
} from "../../api/index.ts";

/**
 * The backend-independent part of {@link IGraphicsDeviceFeatures}.
 *
 * Holds the feature flags and builds the set of supported texture formats from them.
 * Subclasses only detect the flags in {@link _detectFeatures}, and must call {@link _initialize}
 * at the end of their constructor (not from here, as subclass fields are not yet set during `super()`).
 */
export abstract class AGraphicsDeviceFeatures implements IGraphicsDeviceFeatures {

    private readonly _supportedTextureFormats = new Set<TextureFormat>();

    /** Whether S3TC (BC1-BC3) is supported. By default, false. */
    protected _supportsTextureCompressionS3TC = false;

    /** Whether sRGB S3TC is supported. By default, false. */
    protected _supportsTextureCompressionS3TCSrgb = false;

    /** Whether BC (BC7 here) is supported. By default, false. */
    protected _supportsTextureCompressionBC = false;

    /** Whether ETC2 / EAC is supported. By default, false. */
    protected _supportsTextureCompressionETC2 = false;

    /** Whether ASTC is supported. By default, false. */
    protected _supportsTextureCompressionASTC = false;

    /** Whether PVRTC 1 is supported. By default, false. */
    protected _supportsTextureCompressionPVRTC = false;

    /**
     * Detects the features and sets the protected `_supports*` flags. Called from {@link _initialize}.
     */
    protected abstract _detectFeatures(): void;

    /**
     * The uncompressed formats this backend supports.
     * By default, `RGBA_8_UNORM`, `RGBA_8_UNORM_SRGB`, `DEPTH_24_STENCIL_8` and `DEPTH_32_FLOAT`.
     */
    protected _getUncompressedTextureFormats(): TextureFormat[] {
        return [
            TextureFormat.RGBA_8_UNORM,
            TextureFormat.RGBA_8_UNORM_SRGB,
            TextureFormat.DEPTH_24_STENCIL_8,
            TextureFormat.DEPTH_32_FLOAT,
        ];
    }

    /**
     * Detects the features and builds the supported format set. Call once, at the end of the subclass constructor.
     */
    protected _initialize(): void {
        this._detectFeatures();

        const formats = this._supportedTextureFormats;
        formats.clear();
        this._getUncompressedTextureFormats().forEach(f => formats.add(f));

        if (this._supportsTextureCompressionS3TC) {
            formats.add(TextureFormat.BC1_RGB_UNORM);
            formats.add(TextureFormat.BC3_RGBA_UNORM);
        }
        if (this._supportsTextureCompressionS3TCSrgb) {
            formats.add(TextureFormat.BC1_RGB_SRGB);
            formats.add(TextureFormat.BC3_RGBA_SRGB);
        }
        if (this._supportsTextureCompressionBC) {
            formats.add(TextureFormat.BC7_RGBA_UNORM);
            formats.add(TextureFormat.BC7_RGBA_SRGB);
        }
        if (this._supportsTextureCompressionETC2) {
            formats.add(TextureFormat.ETC2_RGB8_UNORM);
            formats.add(TextureFormat.ETC2_RGB8_SRGB);
            formats.add(TextureFormat.ETC2_RGBA8_UNORM);
            formats.add(TextureFormat.ETC2_RGBA8_SRGB);
        }
        if (this._supportsTextureCompressionASTC) {
            ASTC_TEXTURE_FORMATS.forEach(f => formats.add(f));
        }
        if (this._supportsTextureCompressionPVRTC) {
            formats.add(TextureFormat.PVRTC_4BPPV1_RGBA);
            formats.add(TextureFormat.PVRTC_4BPPV1_RGB);
            formats.add(TextureFormat.PVRTC_2BPPV1_RGBA);
            formats.add(TextureFormat.PVRTC_2BPPV1_RGB);
        }
    }

    /** @inheritDoc */
    public get supportsTextureCompressionS3TC(): boolean {
        return this._supportsTextureCompressionS3TC;
    }

    /** @inheritDoc */
    public get supportsTextureCompressionS3TCSrgb(): boolean {
        return this._supportsTextureCompressionS3TCSrgb;
    }

    /** @inheritDoc */
    public get supportsTextureCompressionBC(): boolean {
        return this._supportsTextureCompressionBC;
    }

    /** @inheritDoc */
    public get supportsTextureCompressionETC2(): boolean {
        return this._supportsTextureCompressionETC2;
    }

    /** @inheritDoc */
    public get supportsTextureCompressionASTC(): boolean {
        return this._supportsTextureCompressionASTC;
    }

    /** @inheritDoc */
    public get supportsTextureCompressionPVRTC(): boolean {
        return this._supportsTextureCompressionPVRTC;
    }

    /** @inheritDoc */
    public get supportedTextureFormats(): TextureFormat[] {
        return Array.from(this._supportedTextureFormats);
    }

    /** @inheritDoc */
    public supportsTextureFormat(format: TextureFormat): boolean {
        return this._supportedTextureFormats.has(format);
    }
}
