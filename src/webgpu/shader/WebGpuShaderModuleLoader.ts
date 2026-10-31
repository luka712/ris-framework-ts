import type {IFramework, IShaderModule, IShaderModuleLoader} from "../../api/index.ts";
import {shaderModuleCacheKey} from "../../webgl/shader/WebGlShaderModuleLoader.ts";
import {WebGpuShaderModule} from "./WebGpuShaderModule.ts";

/**
 * Loads and caches WGSL shader modules by id.
 * @internal
 */
export class WebGpuShaderModuleLoader implements IShaderModuleLoader {

    private readonly _shaderModules = new Map<string, WebGpuShaderModule>();

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public load(shaderModuleId: string, keyValueDictionary?: { [id: string]: number }): IShaderModule {
        const key = shaderModuleCacheKey(shaderModuleId, keyValueDictionary);
        let module = this._shaderModules.get(key);
        if (!module) {
            module = new WebGpuShaderModule(this._framework, shaderModuleId, keyValueDictionary);
            this._shaderModules.set(key, module);
        }
        return module;
    }

    /** Disposes every cached module. */
    public dispose(): void {
        for (const module of this._shaderModules.values()) {
            module.dispose();
        }
        this._shaderModules.clear();
    }
}
