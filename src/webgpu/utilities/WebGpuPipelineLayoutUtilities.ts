import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The WebGPU pipeline layout utilities. */
export class WebGpuPipelineLayoutUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a pipeline layout.
     * @param device The device.
     * @param bindGroupLayouts The bind group layouts, in group order.
     * @param label The label.
     * @returns The pipeline layout.
     */
    public create(device: GPUDevice, bindGroupLayouts: GPUBindGroupLayout[], label?: string): GPUPipelineLayout {
        return this.withValidation(device, "PipelineLayout", label, () => device.createPipelineLayout({label, bindGroupLayouts}));
    }
}
