/**
 * The WebGPU instance utilities. In the browser the instance is `navigator.gpu`;
 * there is no instance to create and no backend to pick (C# `WebGPUInstanceUtilities.Create`).
 */
export class WebGpuInstanceUtilities {

    /** Whether WebGPU is available, that is whether `navigator.gpu` exists. */
    public isSupported(): boolean {
        return typeof navigator !== "undefined" && !!navigator.gpu;
    }

    /**
     * Gets the WebGPU instance.
     * @returns `navigator.gpu`.
     * @throws If WebGPU is not supported.
     */
    public get(): GPU {
        if (!this.isSupported()) {
            throw new Error("WebGPU is not supported: navigator.gpu is missing.");
        }
        return navigator.gpu;
    }
}
