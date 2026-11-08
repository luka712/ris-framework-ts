import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {type InternalShader, WgslShaderModuleContent} from "../../api/content/ShaderModuleContent.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

const MODULE_INCLUDE_KEYWORD = "#include";

/**
 * The WebGPU shader module.
 * Expands full-line `#include "path"` lines, then replaces `##KEY##` tokens.
 * @internal
 */
export class WebGpuShaderModule implements IShaderModule {

    private _gpuShaderModule: GPUShaderModule | null = null;
    /** Resolved include paths. By default, empty. The registry is not modified. */
    private readonly _modules: {[path: string]: InternalShader} = {};
    /** Full-line `#include "path"`, optional indent and semicolon. The path is group 1. */
    private readonly _moduleRegex = new RegExp(
        `^[ \\t]*${MODULE_INCLUDE_KEYWORD}[ \\t]+"([^"]+)"[ \\t]*;?[ \\t]*$`,
        "gm",
    );

    /**
     * The constructor of the WebGPU shader module.
     * @param framework The framework. Its graphics device must already expose a WebGPU device.
     * @param id Key in {@link WgslShaderModuleContent}, for example `main_frame_buffer`.
     * @param keyValueDictionary Optional `##KEY##` names to numbers. By default, omitted, so no token is replaced.
     */
    public constructor(framework: IFramework, id: string, keyValueDictionary?: {[id: string]: number}) {
        const device = (framework.renderer.graphicsDevice as WebGpuGraphicsDevice).device;
        this._gpuShaderModule = this._loadShader(device, id, keyValueDictionary);
        this.label = id;
    }

    /** The shader id. This is also the GPU shader module label. */
    public readonly label: string;

    /** @inheritDoc */
    public readonly stages: ShaderStage[] = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];

    /** @inheritDoc */
    public get nativeHandle(): any {
        return this._gpuShaderModule;
    }

    /**
     * The WebGPU shader module.
     * @returns The module created in the constructor.
     * @throws When {@link dispose} has cleared it.
     */
    public get gpuShaderModule(): GPUShaderModule {
        if (!this._gpuShaderModule) {
            throw new Error("WebGpuShaderModule: the module is disposed.");
        }
        return this._gpuShaderModule;
    }

    /**
     * Loads the included WGSL source for `path`.
     * @param path The path inside `#include "path"`. The content id is not a path.
     * @returns That entry's `shader` text.
     * @throws `Module "<path>" not found.` when no entry has this `path`, or its `shader` is absent.
     */
    private _loadModule(path: string): string {
        let module = this._modules[path];
        if (module?.shader !== undefined) {
            return module.shader;
        }

        for (const id in WgslShaderModuleContent) {
            module = WgslShaderModuleContent[id];
            if (module.path === path && module.shader !== undefined) {
                this._modules[path] = module;
                return module.shader;
            }
        }

        throw new Error(`Module "${path}" not found.`);
    }

    /**
     * Replaces each full-line `#include "path"` with that module's source.
     * A path is inserted once. A repeat, including through nesting or a cycle, is removed.
     * Text is copied literally, so `$` sequences are not patterns. `##KEY##` is not replaced here.
     * @param source Shader or module source.
     * @param seen Paths already inserted. By default, a new empty set.
     * @returns `source` with include lines expanded or removed.
     */
    private _injectModules(source: string, seen: Set<string> = new Set()): string {
        const pattern = new RegExp(this._moduleRegex.source, this._moduleRegex.flags);
        let result = "";
        let cursor = 0;

        for (const match of source.matchAll(pattern)) {
            const path = match[1];
            const index = match.index ?? 0;
            result += source.slice(cursor, index);
            if (path !== undefined && !seen.has(path)) {
                seen.add(path);
                result += this._injectModules(this._loadModule(path), seen);
            }
            cursor = index + match[0].length;
        }

        return result + source.slice(cursor);
    }

    /**
     * Builds the GPU shader module for `id`.
     * Includes are expanded before `##KEY##` replacement.
     * @param device The WebGPU device.
     * @param id Key in {@link WgslShaderModuleContent}.
     * @param keyValueDictionary Optional replacements. By default, omitted.
     * @returns The created shader module.
     * @throws `WGSL shader '<id>' is not implemented for WebGPU.` when `id` is missing or `shader` is absent.
     */
    private _loadShader(device: GPUDevice, id: string, keyValueDictionary?: {[id: string]: number}): GPUShaderModule {
        let code = WgslShaderModuleContent[id]?.shader;
        if (code === undefined) {
            throw new Error(`WGSL shader '${id}' is not implemented for WebGPU.`);
        }

        code = this._injectModules(code);
        if (keyValueDictionary) {
            for (const key in keyValueDictionary) {
                code = code.split(`##${key}##`).join(String(keyValueDictionary[key]));
            }
        }

        return WebGpuUtilities.shaderModule.create(device, code, id);
    }

    /**
     * Drops the native shader module. {@link gpuShaderModule} throws after this.
     * Calling it again leaves the field null.
     */
    public dispose(): void {
        this._gpuShaderModule = null;
    }
}
