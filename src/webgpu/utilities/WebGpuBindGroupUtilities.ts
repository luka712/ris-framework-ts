import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The WebGPU bind group utilities. */
export class WebGpuBindGroupUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a bind group.
     * @param device The device.
     * @param layout The bind group layout.
     * @param entries The entries.
     * @param label The label.
     * @returns The bind group.
     */
    public create(device: GPUDevice, layout: GPUBindGroupLayout, entries: GPUBindGroupEntry[], label?: string): GPUBindGroup {
        return this.withValidation(device, "BindGroup", label, () => device.createBindGroup({label, layout, entries}));
    }
}
