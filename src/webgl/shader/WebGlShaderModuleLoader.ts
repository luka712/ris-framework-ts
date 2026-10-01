import WebGlShaderModule from "./WebGlShaderModule.ts";
import type {IFramework, IShaderModule} from "ris-framework-api";


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

    /**
     * The content types provided by this content module.
     * @param assetFilePathOrIdentifier The asset file path or identifier of the content to load.
     */
    public load(assetFilePathOrIdentifier: string): IShaderModule {

        // Here something like 'sprite' is provided, we must resolve it.

        // Is it already cached?
        let shaderModule = this._shaderModules.get(assetFilePathOrIdentifier);
        if (!shaderModule) {

            // If it does not exist create one and set it.
            shaderModule = new WebGlShaderModule(this._framework, assetFilePathOrIdentifier);
            this._shaderModules.set(assetFilePathOrIdentifier, shaderModule);
        }
        return shaderModule;
    }


}