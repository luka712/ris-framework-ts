import { AGraphicsDeviceFeatures } from "../core/rendering/AGraphicsDeviceFeatures.ts";

/**
 * The WebGL implementation of the IGraphicsDeviceFeatures interface.
 * Features are detected from the WebGL2 extensions; enabling an extension happens on `getExtension`.
 */
export class WebGlGraphicsDeviceFeatures extends AGraphicsDeviceFeatures {

    private readonly _webgl: WebGL2RenderingContext;

    /**
     * Creates a new instance of WebGLGraphicsDeviceFeatures.
     * @param webgl The WebGL2RenderingContext.
     */
    public constructor(webgl: WebGL2RenderingContext) {
        super();
        this._webgl = webgl;
        this._initialize();
    }

    /** @inheritDoc */
    protected _detectFeatures(): void {
        const webgl = this._webgl;

        // The ASTC extension includes the sRGB variants of all block sizes.
        this.astcExtension = webgl.getExtension("WEBGL_compressed_texture_astc") ?? undefined;
        this._supportsTextureCompressionASTC = !!this.astcExtension;

        // BPTC holds BC6H/BC7 (linear and sRGB).
        this.bptcExtension = webgl.getExtension("EXT_texture_compression_bptc") ?? undefined;
        this._supportsTextureCompressionBC = !!this.bptcExtension;

        // The ETC extension includes the sRGB variants.
        this.etcExtension = webgl.getExtension("WEBGL_compressed_texture_etc") ?? undefined;
        this._supportsTextureCompressionETC2 = !!this.etcExtension;

        this.s3tcExtension = webgl.getExtension("WEBGL_compressed_texture_s3tc") ?? undefined;
        this._supportsTextureCompressionS3TC = !!this.s3tcExtension;

        this.s3tcSrgbExtension = webgl.getExtension("WEBGL_compressed_texture_s3tc_srgb") ?? undefined;
        this._supportsTextureCompressionS3TCSrgb = !!this.s3tcSrgbExtension;

        this.pvrtcExtension = webgl.getExtension("WEBGL_compressed_texture_pvrtc") ?? undefined;
        this._supportsTextureCompressionPVRTC = !!this.pvrtcExtension;
    }

    /** The WEBGL_compressed_texture_astc extension. Undefined if not supported. */
    public astcExtension?: WEBGL_compressed_texture_astc;

    /** The EXT_texture_compression_bptc extension. Undefined if not supported. */
    public bptcExtension?: EXT_texture_compression_bptc;

    /** The WEBGL_compressed_texture_etc extension. Undefined if not supported. */
    public etcExtension?: WEBGL_compressed_texture_etc;

    /** The WEBGL_compressed_texture_pvrtc extension. Undefined if not supported. */
    public pvrtcExtension?: WEBGL_compressed_texture_pvrtc;

    /** The WEBGL_compressed_texture_s3tc extension. Undefined if not supported. */
    public s3tcExtension?: WEBGL_compressed_texture_s3tc;

    /** The WEBGL_compressed_texture_s3tc_srgb extension. Undefined if not supported. */
    public s3tcSrgbExtension?: WEBGL_compressed_texture_s3tc_srgb;
}
