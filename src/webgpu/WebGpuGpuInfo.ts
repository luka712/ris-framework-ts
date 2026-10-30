import {type IGPUInfo, RenderingBackend, TextureFormat} from "../api/index.ts";
import type {GpuAdapter} from "./WebGpuTypes.ts";
import type {WebGpuGraphicsDeviceFeatures} from "./WebGpuGraphicsDeviceFeatures.ts";

/**
 * The WebGPU GPU info, read from the adapter info.
 * @internal
 */
export class WebGpuGpuInfo implements IGPUInfo {

    /**
     * The constructor.
     * @param adapter The adapter.
     * @param features The device features.
     */
    public constructor(adapter: GpuAdapter, features: WebGpuGraphicsDeviceFeatures) {
        const info = adapter.info;
        this.name = info?.description || info?.device || info?.architecture || "Unknown";
        this.vendor = info?.vendor || "Unknown";
        this.apiVersion = "WebGPU";
        this.api = RenderingBackend.WEB_GPU;
        // The native API behind WebGPU (Vulkan, Metal, D3D12) is hidden from the page.
        this.underlyingBackend = RenderingBackend.DEFAULT;

        const formats: TextureFormat[] = [];
        if (features.supportsTextureCompressionASTC) {
            formats.push(TextureFormat.ASTC_4X4_RGBA);
        }
        if (features.supportsTextureCompressionS3TC) {
            formats.push(TextureFormat.BC3_RGBA_UNORM);
        }
        if (features.supportsTextureCompressionETC2) {
            formats.push(TextureFormat.ETC2_RGBA8_UNORM);
        }
        if (features.supportsTextureCompressionBC) {
            formats.push(TextureFormat.BC7_RGBA_UNORM);
        }
        this.supportedCompressedTextureFormats = formats;
    }

    /** @inheritDoc */
    public readonly name: string;

    /** @inheritDoc */
    public readonly vendor: string;

    /** @inheritDoc */
    public readonly apiVersion: string;

    /** @inheritDoc */
    public readonly api: RenderingBackend;

    /** @inheritDoc */
    public readonly underlyingBackend: RenderingBackend;

    /** @inheritDoc */
    public readonly supportedCompressedTextureFormats: TextureFormat[];
}
