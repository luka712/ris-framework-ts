/** The utilities for WebGPU device. */
export class WebGpuDeviceUtilities {

    /**
     * Requests a WebGPU device.
     * @param adapter The adapter.
     * @param requiredFeatures The required features.
     * @param requiredLimits The required limits.
     * @param label The label.
     * @returns The WebGPU device.
     */
    public async requestDeviceAsync(adapter: GPUAdapter,
         requiredFeatures: GPUFeatureName[], 
         requiredLimits: Record<string, number>,
        label: string): Promise<GPUDevice> {
        
        const device = await adapter.requestDevice({
            requiredFeatures: requiredFeatures,
            label: label,
            requiredLimits: requiredLimits,
        });
        if(!device) {
            throw new Error("WebGPU is not supported: no device was found.");
        }
        return device;
    }
}