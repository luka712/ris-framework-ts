import type {IGraphicsDeviceFeatures} from "../api/index.ts";
import type {GpuSupportedFeatures} from "./WebGpuTypes.ts";

/**
 * The WebGPU graphics device features, read from the device's enabled features.
 * @internal
 */
export class WebGpuGraphicsDeviceFeatures implements IGraphicsDeviceFeatures {

    /**
     * The constructor.
     * @param features The device's enabled features.
     */
    public constructor(features: GpuSupportedFeatures) {
        this.supportsTextureCompressionBC = features.has("texture-compression-bc");
        // S3TC (BC1-BC3) is part of the WebGPU BC feature.
        this.supportsTextureCompressionS3TC = this.supportsTextureCompressionBC;
        this.supportsTextureCompressionS3TCSrgb = this.supportsTextureCompressionBC;
        this.supportsTextureCompressionETC2 = features.has("texture-compression-etc2");
        this.supportsTextureCompressionASTC = features.has("texture-compression-astc");
        this.supportsTextureCompressionPVRTC = false;
    }

    /** @inheritDoc */
    public readonly supportsTextureCompressionS3TC: boolean;

    /** @inheritDoc */
    public readonly supportsTextureCompressionS3TCSrgb: boolean;

    /** @inheritDoc */
    public readonly supportsTextureCompressionBC: boolean;

    /** @inheritDoc */
    public readonly supportsTextureCompressionETC2: boolean;

    /** @inheritDoc */
    public readonly supportsTextureCompressionASTC: boolean;

    /** @inheritDoc */
    public readonly supportsTextureCompressionPVRTC: boolean;
}
