import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The WebGPU shader module utilities. */
export class WebGpuShaderModuleUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a WGSL shader module and logs compilation errors.
     * @param device The device.
     * @param shaderCode The WGSL code.
     * @param label The label.
     * @returns The shader module.
     */
    public create(device: GPUDevice, shaderCode: string, label?: string): GPUShaderModule {
        const module = this.withValidation(device, "ShaderModule", label, () => device.createShaderModule({label, code: shaderCode}));
        module.getCompilationInfo?.().then((info: GPUCompilationInfo) => {
            for (const message of info.messages) {
                if (message.type === "error") {
                    this.logger?.error(`WGSL ${label ?? ""}:${message.lineNum}:${message.linePos} ${message.message}`);
                }
            }
        }).catch(() => { /* ignore */ });
        return module;
    }
}
