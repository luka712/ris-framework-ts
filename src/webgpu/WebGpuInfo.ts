import {type IGPUInfo, RenderingBackend, TextureFormat, TextureUtilities} from "../api/index.ts";
import type {WebGpuGraphicsDeviceFeatures} from "./WebGpuGraphicsDeviceFeatures.ts";

/**
 * The WebGPU GPU info, read from the adapter info.
 * @internal
 */
export class WebGPUInfo implements IGPUInfo {

    /**
     * The constructor.
     * @param adapter The adapter.
     * @param features The device features.
     */
    public constructor(adapter: GPUAdapter, features: WebGpuGraphicsDeviceFeatures) {
        const info = adapter.info;
        this.name = info?.description || info?.device || info?.architecture || "Unknown";
        this.vendor = info?.vendor || "Unknown";
        this.apiVersion = "WebGPU";
        this.api = RenderingBackend.WEB_GPU;
        // The native API behind WebGPU (Vulkan, Metal, D3D12) is hidden from the page.
        this.underlyingBackend = RenderingBackend.DEFAULT;

        // Features are read from the device (only requested features are enabled), so this lists what can be created.
        const formats = features.supportedTextureFormats
            .filter(f => TextureUtilities.isCompressedTextureFormat(f));
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
