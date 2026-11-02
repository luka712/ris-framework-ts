import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WgslShaderContent} from "./WgslShaderContent.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * A WGSL shader module. One module holds both stages (`main_vs` and `main_fs`).
 * @internal
 */
export class WebGpuShaderModule implements IShaderModule {

    private _gpuShaderModule: GPUShaderModule | null;

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
        this._gpuShaderModule = WebGpuUtilities.shaderModule.create(device, code, id);
        this.label = id;
    }

    /** The shader id. */
    public readonly label: string;

    /** @inheritDoc */
    public readonly stages: ShaderStage[] = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];

    /** The WebGPU shader module. */
    public get gpuShaderModule(): GPUShaderModule {
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
