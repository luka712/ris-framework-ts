import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WgslShaderModuleContent} from "../../api/content/ShaderModuleContent.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

const MODULE_IMPORT_KEYWORD = "#import";


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
     * @param keyValueDictionary Optional `##KEY##` replacements, like the WebGL loader. By default, omitted, so no token is replaced. A key that is absent has no default number and its `##KEY##` text stays.
     */
    public constructor(framework: IFramework, id: string, keyValueDictionary?: { [id: string]: number }) {
        let code = WgslShaderModuleContent[id]?.shader;
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

    /**
     * Loads the shader module code from path.
     * @param path The path.
     * @private
     */
    private _loadModule(path: string): string {

        let module = this._modules[path];

        if (module) {
            if (module.shader === undefined) {
                throw new Error(`Module "${path}" not found.`);
            }
            return module.shader;
        }

        for (const id in WgslShaderModuleContent) {
            module = WgpuShaderModuleContent[id];
            (module as unknown as Record<string, InternalShader>)[path] = module;
            if (module.path === path) {
                if (module.shader === undefined) {
                    throw new Error(`Module "${path}" not found.`);
                }
                return module.shader;
            }
        }

        throw new Error(`Module "${path}" not found.`);
    }

    /**
     * Injects modules to the shader.
     * @param shaderSource The shader source.
     * @private The source with modules.
     */
    private _injectModules(shaderSource: string): string {

        let match : RegExpExecArray | null = null;
        while ((match = this._moduleRegex.exec(shaderSource)) !== null) {
            const modulePath = match[1];
            const module = this._loadModule(modulePath);
            shaderSource = shaderSource.replace(this._moduleRegex, module);
        }

        return shaderSource;
    }

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
