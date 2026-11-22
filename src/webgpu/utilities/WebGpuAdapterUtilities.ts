import { PowerPreferenceType } from "../../api";

/** The utilities for WebGPU adapter. */
export class WebGpuAdapterUtilities {

    /** 
     * Requests a WebGPU adapter.
     * @param powerPreference The power preference.
     * @returns The WebGPU adapter.
     */
    public async requestAdapterAsync(powerPreference: PowerPreferenceType): Promise<GPUAdapter> {
        

        const gpu = navigator.gpu;


        if (!gpu) {
            throw new Error("WebGPU is not supported: navigator.gpu is missing.");
        }

        let gpuPowerPreference : GPUPowerPreference | undefined = undefined;
        if(powerPreference === PowerPreferenceType.LOW_POWER) {
            gpuPowerPreference = "low-power";
        } else if(powerPreference === PowerPreferenceType.HIGH_PERFORMANCE) {
            gpuPowerPreference = "high-performance";
        }
        
        const adapter = await gpu.requestAdapter({
            powerPreference: gpuPowerPreference,
            
        });
        if(!adapter) {
            throw new Error("WebGPU is not supported: no adapter was found.");
        }
        return adapter;
    }

}