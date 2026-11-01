import WebGlShaderModule from "./WebGlShaderModule.ts";
import type {IFramework, IShaderModule} from "../../api/index.ts";


/**
 * Builds the cache key of a shader module: the id plus the sorted replacement values,
 * so the same shader with different `##KEY##` values (e.g. light counts) is compiled separately.
 * @param id The shader module id.
 * @param keyValueDictionary The optional replacement values.
 * @internal
 */
export function shaderModuleCacheKey(id: string, keyValueDictionary?: {[id: string]: number}): string {
    if (!keyValueDictionary) {
        return id;
    }
    const entries = Object.keys(keyValueDictionary).sort().map(key => `${key}=${keyValueDictionary[key]}`);
    return entries.length === 0 ? id : `${id}?${entries.join("&")}`;
}

/**
 * The content WebGL implementation of ShaderContentModule.
 */
export class WebGlShaderModuleLoader {
    private readonly _shaderModules: Map<string, WebGlShaderModule> = new Map<string, WebGlShaderModule>();
    private readonly _framework: IFramework;

    /**
     * The WebGL shader content module.
     * @param framework The framework.
     */
    public constructor(framework: IFramework) {
        this._framework = framework;
    }

    /** @inheritDoc */
    public load(assetFilePathOrIdentifier: string, keyValueDictionary?: {[id:string]: number} ): IShaderModule {

        // Here something like 'sprite' is provided, we must resolve it.

        // Is it already cached?
        const cacheKey = shaderModuleCacheKey(assetFilePathOrIdentifier, keyValueDictionary);
        let shaderModule = this._shaderModules.get(cacheKey);
        if (!shaderModule) {

            // If it does not exist create one and set it.
            shaderModule = new WebGlShaderModule(this._framework, assetFilePathOrIdentifier, keyValueDictionary);
            this._shaderModules.set(cacheKey, shaderModule);
        }
        return shaderModule;
    }

    /** Deletes every cached shader program and clears the cache. */
    public dispose(): void {
        for (const shaderModule of this._shaderModules.values()) {
            shaderModule.dispose();
        }
        this._shaderModules.clear();
    }
}
