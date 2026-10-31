import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import type {GpuShaderModule} from "../WebGpuTypes.ts";
import {WgslShaderContent} from "./WgslShaderContent.ts";

/**
 * A WGSL shader module. One module holds both stages (`main_vs` and `main_fs`).
 * @internal
 */
export class WebGpuShaderModule implements IShaderModule {

    private _gpuShaderModule: GpuShaderModule | null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param id The built-in shader id, for example `unlit_material`.
     * @param keyValueDictionary Optional `##KEY##` replacements, like the WebGL loader.
     */
    public constructor(framework: IFramework, id: string, keyValueDictionary?: { [id: string]: number }) {
        let code = WgslShaderContent[id];
        if (code === undefined) {
            throw new Error(`WGSL shader '${id}' is not implemented for WebGPU.`);
        }
        if (keyValueDictionary) {
            for (const key in keyValueDictionary) {
                code = code.split(`##${key}##`).join(String(keyValueDictionary[key]));
            }
        }
        const device = (framework.renderer.graphicsDevice as WebGpuGraphicsDevice).device;
        this._gpuShaderModule = device.createShaderModule({label: id, code});
        this.label = id;
        this._gpuShaderModule.getCompilationInfo?.().then(info => {
            for (const message of info.messages) {
                if (message.type === "error") {
                    console.error(`WGSL ${id}:${message.lineNum}:${message.linePos} ${message.message}`);
                }
            }
        }).catch(() => { /* ignore */ });
    }

    /** The shader id. */
    public readonly label: string;

    /** @inheritDoc */
    public readonly stages: ShaderStage[] = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];

    /** The WebGPU shader module. */
    public get gpuShaderModule(): GpuShaderModule {
        if (!this._gpuShaderModule) {
            throw new Error("WebGpuShaderModule: the module is disposed.");
        }
        return this._gpuShaderModule;
    }

    /** @inheritDoc */
    public get nativeHandle(): any {
        return this._gpuShaderModule;
    }

    /** @inheritDoc */
    public dispose(): void {
        this._gpuShaderModule = null;
    }
}
