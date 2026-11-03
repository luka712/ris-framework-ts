import { TextureFormat } from "../api/index.ts";
import { AGraphicsDeviceFeatures } from "../core/rendering/AGraphicsDeviceFeatures.ts";

/**
 * The WebGPU graphics device features, read from the adapter's supported features.
 * The detected compression features are listed in {@link deviceRequiredFeatures}, which must be requested
 * when creating the device, as WebGPU only enables requested features.
 * @internal
 */
export class WebGpuGraphicsDeviceFeatures extends AGraphicsDeviceFeatures {

    private readonly _features: GPUSupportedFeatures;

    /**
     * The constructor.
     * @param features The adapter's (or device's) supported features.
     */
    public constructor(features: GPUSupportedFeatures) {
        super();
        this._features = features;
        this._initialize();
    }

    /** The features to request when creating the device. By default, empty. */
    public readonly deviceRequiredFeatures: GPUFeatureName[] = [];

    /** @inheritDoc */
    protected _detectFeatures(): void {
        const features = this._features;
        this.deviceRequiredFeatures.length = 0;

        this._supportsTextureCompressionBC = features.has("texture-compression-bc");
        // S3TC (BC1-BC3), including sRGB, is part of the WebGPU BC feature.
        this._supportsTextureCompressionS3TC = this._supportsTextureCompressionBC;
        this._supportsTextureCompressionS3TCSrgb = this._supportsTextureCompressionBC;
        this._supportsTextureCompressionETC2 = features.has("texture-compression-etc2");
        this._supportsTextureCompressionASTC = features.has("texture-compression-astc");
        // WebGPU has no PVRTC.
        this._supportsTextureCompressionPVRTC = false;

        if (this._supportsTextureCompressionBC) {
            this.deviceRequiredFeatures.push("texture-compression-bc");
        }
        if (this._supportsTextureCompressionETC2) {
            this.deviceRequiredFeatures.push("texture-compression-etc2");
        }
        if (this._supportsTextureCompressionASTC) {
            this.deviceRequiredFeatures.push("texture-compression-astc");
        }
    }

    /**
     * The uncompressed formats. By default, the base formats plus `RED_32_FLOAT`, which only the WebGPU converter maps.
     */
    protected override _getUncompressedTextureFormats(): TextureFormat[] {
        return [...super._getUncompressedTextureFormats(), TextureFormat.RED_32_FLOAT];
    }
}
