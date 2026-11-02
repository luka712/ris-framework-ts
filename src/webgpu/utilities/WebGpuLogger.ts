/**
 * The logger used by the WebGPU utilities, like the optional `ILogger` in the C# utilities. `console` fits.
 */
export interface IWebGpuLogger {
    error(message: string): void;
    warn(message: string): void;
    info(message: string): void;
}

/**
 * The base of the WebGPU utilities that log. Mirrors the C# `Logger` property and the
 * `DevicePushErrorScope` / `DevicePopErrorScope` validation pattern.
 */
export abstract class AWebGpuLoggingUtilities {

    /** The logger. By default, `console`. Set to null to disable logging. */
    public logger: IWebGpuLogger | null = console;

    /**
     * Runs `create` inside a validation error scope and logs a validation error, like the C# utilities do in debug builds.
     * The browser reports the error asynchronously, so it is logged rather than thrown.
     * @param device The device.
     * @param what The object being created, for the message. For example `ShaderModule`.
     * @param label The label of the object.
     * @param create Creates the object.
     */
    protected withValidation<T>(device: GPUDevice, what: string, label: string | undefined, create: () => T): T {
        device.pushErrorScope("validation");
        const result = create();
        device.popErrorScope().then(error => {
            if (error) {
                this.logger?.error(`Failed to create ${what} '${label ?? ""}': ${error.message}`);
            }
        }).catch(() => { /* The device was lost. */ });
        return result;
    }
}
