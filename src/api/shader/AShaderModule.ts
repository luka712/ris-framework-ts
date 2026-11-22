import { type IShaderModule, MODULE_INCLUDE_KEYWORD } from "./IShaderModule.ts";
import { ShaderStage } from "./ShaderStage.ts";
import { type InternalShader } from "../content/ShaderModuleContent.ts";




export abstract class AShaderModule implements IShaderModule {

    /** Resolved include paths, cached on this instance. By default, empty. The shared registry is not modified. */
    private readonly _modules: { [path: string]: InternalShader } = {};
    protected readonly _moduleRegex = new RegExp(
        `^\\s*${MODULE_INCLUDE_KEYWORD}\\s+"([^"]+)"\\s*;?\\s*$`,
        "gm",
    );


    /** @inheritDoc */
    public stages: ShaderStage[] = [];

    /** @inheritDoc */
    public nativeHandle?: any;

    /** The module content. */
    protected abstract readonly shaderModuleContent: { [id: string]: InternalShader };

    /**
     * Loads the included source for `path`.
     * @param path The path inside `#include "path"`.
     * @returns That entry's `shader` text.
     * @throws Error when no entry has this `path`, or its `shader` is absent.
     * @private
     */
    protected _loadModule(path: string): string {

        const cached = this._modules[path];
        if (cached?.shader !== undefined) {
            return cached.shader;
        }

        for (const id in this.shaderModuleContent) {
            const module = this.shaderModuleContent[id];
            if (module.path === path && module.shader !== undefined) {
                this._modules[path] = module;
                return module.shader;
            }
        }

        throw new Error(`WebGlShaderModule: #include "${path}" not found; no GlslShaderModuleContent entry has this path and a shader.`);
    }

    /**
     * Replaces each full-line `#include "path"` with that module's source.
     * @param shaderSource The shader source.
     * @returns The source with modules.
     * @private
     */
    protected _injectModules(shaderSource: string): string {

        let match: RegExpExecArray | null = null;
        while ((match = this._moduleRegex.exec(shaderSource)) !== null) {
            const modulePath = match[1];
            const module = this._loadModule(modulePath);
            shaderSource = shaderSource.replace(this._moduleRegex, module);
        }

        return shaderSource;
    }


    /** @inheritdoc */
    public abstract dispose(): void;
}
