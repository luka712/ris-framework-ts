import type {IGraphicsDeviceFeatures} from "../api/index.ts";

/**
 * The WebGPU graphics device features, read from the device's enabled features.
 * @internal
 */
export class WebGpuGraphicsDeviceFeatures implements IGraphicsDeviceFeatures {

    /**
     * The constructor.
     * @param features The device's enabled features.
     */
    public constructor(features: GPUSupportedFeatures) {
        this.supportsTextureCompressionBC = features.has("texture-compression-bc");
        // S3TC (BC1-BC3) is part of the WebGPU BC feature.
        this.supportsTextureCompressionS3TC = this.supportsTextureCompressionBC;
        this.supportsTextureCompressionS3TCSrgb = this.supportsTextureCompressionBC;
        this.supportsTextureCompressionETC2 = features.has("texture-compression-etc2");
        this.supportsTextureCompressionASTC = features.has("texture-compression-astc");
        this.supportsTextureCompressionPVRTC = false;

        if(this.supportsTextureCompressionBC) {
            this.deviceRequiredFeatures.push("texture-compression-bc");
        }
        if(this.supportsTextureCompressionETC2) {
            this.deviceRequiredFeatures.push("texture-compression-etc2");
        }
        if(this.supportsTextureCompressionASTC) {
            this.deviceRequiredFeatures.push("texture-compression-astc");
        }
        if(this.supportsTextureCompressionPVRTC) {
            this.deviceRequiredFeatures.push("texture-compression-etc2");
        }
    }

    /** The required features for the device. */
    public readonly deviceRequiredFeatures: GPUFeatureName[] = [];

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
