import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The WebGPU bind group layout utilities. */
export class WebGpuBindGroupLayoutUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a bind group layout.
     * @param device The device.
     * @param entries The entries.
     * @param label The label.
     * @returns The bind group layout.
     */
    public create(device: GPUDevice, entries: GPUBindGroupLayoutEntry[], label?: string): GPUBindGroupLayout {
        return this.withValidation(device, "BindGroupLayout", label, () => device.createBindGroupLayout({label, entries}));
    }
}
