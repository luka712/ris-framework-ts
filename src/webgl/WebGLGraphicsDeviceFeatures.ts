import type {IGraphicsDeviceFeatures} from "ris-framework-api";

/**
 * The WebGL implementation of the IGraphicsDeviceFeatures interface.
 */
export class WebGLGraphicsDeviceFeatures implements IGraphicsDeviceFeatures {

    /**
     * Creates a new instance of WebGLGraphicsDeviceFeatures.
     * @param webgl The WebGL2RenderingContext.
     */
    public constructor(webgl: WebGL2RenderingContext) {
        this.astcExtension = webgl.getExtension("WEBGL_compressed_texture_astc") as WEBGL_compressed_texture_astc;
        this.supportsTextureCompressionASTC = !!this.astcExtension;

        this.bptcExtension = webgl.getExtension("EXT_texture_compression_bptc") as EXT_texture_compression_bptc;
        this.supportsTextureCompressionS3TC = !!this.bptcExtension;

        this.etcExtension = webgl.getExtension("WEBGL_compressed_texture_etc") as WEBGL_compressed_texture_etc;
        this.supportsTextureCompressionETC2 = !!this.etcExtension;

        this.s3tcExtension = webgl.getExtension("WEBGL_compressed_texture_s3tc") as WEBGL_compressed_texture_s3tc;
        this.supportsTextureCompressionBC = !!this.s3tcExtension;

        this.pvrtcExtension = webgl.getExtension("WEBGL_compressed_texture_pvrtc") as WEBGL_compressed_texture_pvrtc;
        this.supportsTextureCompressionPVRTC = !!this.pvrtcExtension;
    }

    /** The WEBGL_compressed_texture_astc extension. */
    readonly astcExtension?: WEBGL_compressed_texture_astc;

    /** @inheritdoc */
    readonly supportsTextureCompressionASTC: boolean;

    /** The EXT_texture_compression_bptc extension. */
    readonly bptcExtension?: EXT_texture_compression_bptc;

    /** @inheritdoc */
    readonly supportsTextureCompressionBC: boolean;

    /** The WEBGL_compressed_texture_etc extension. */
    readonly etcExtension: WEBGL_compressed_texture_etc;

    /** @inheritdoc */
    readonly supportsTextureCompressionETC2: boolean;

    /** The WEBGL_compressed_texture_pvrtc extension. */
    readonly pvrtcExtension?: WEBGL_compressed_texture_pvrtc;

    readonly supportsTextureCompressionPVRTC: boolean;

    /** The WEBGL_compressed_texture_s3tc extension. */
    readonly s3tcExtension?: WEBGL_compressed_texture_s3tc

    /** @inheritdoc */
    readonly supportsTextureCompressionS3TC: boolean;
}
