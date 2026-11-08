import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {type InternalShader, WgslShaderModuleContent} from "../../api/content/ShaderModuleContent.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/** The text that starts a full-line WGSL import directive. */
const MODULE_IMPORT_KEYWORD = "#import";

/**
 * A WGSL shader module. One module holds both stages (`main_vs` and `main_fs`).
 *
 * Before `##KEY##` replacement, each full-line import is expanded from {@link WgslShaderModuleContent}.
 * The line is optional indent (spaces or tabs), then `#import`, then a double-quoted path, then an optional semicolon.
 * Single quotes are not an import. The path must equal an entry's `path`. The content id is not a path.
 *
 * A path is inserted once. A later import of that same path, including through nesting or a cycle, is removed.
 * Each distinct path gets its own source. Text is copied with slices, so `$` sequences stay literal.
 * The registry is not modified. Resolved entries are cached on this instance in {@link _modules}, which starts empty.
 *
 * After imports, every `##KEY##` whose name is in `keyValueDictionary` becomes that number's decimal text.
 * A token whose key is absent is left unchanged. When `keyValueDictionary` is omitted, no token is replaced.
 *
 * A missing id, or an entry whose `shader` is absent, throws `WGSL shader '<id>' is not implemented for WebGPU.`
 * An import path that is not registered, or whose `shader` is absent, throws `Module "<path>" not found.`
 * Neither case creates a GPU shader module.
 * @internal
 */
export class WebGpuShaderModule implements IShaderModule {

    /**
     * The native shader module created for this id.
     * Set by the constructor. After {@link dispose}, this is null.
     */
    private _gpuShaderModule: GPUShaderModule | null;

    /**
     * Import path to the registry entry that supplied it.
     * By default, empty. Filled by {@link _loadModule}. Entries are not copied back onto the registry.
     */
    private readonly _modules: {[path: string]: InternalShader} = {};

    /**
     * Full-line `#import "path"` matcher, built from {@link MODULE_IMPORT_KEYWORD}.
     * Spaces and tabs only; a newline is not skipped. The path is capture group 1.
     */
    private readonly _moduleRegex = new RegExp(
        `^[ \\t]*${MODULE_IMPORT_KEYWORD}[ \\t]+"([^"]+)"[ \\t]*;?[ \\t]*$`,
        "gm",
    );

    /**
     * Loads `id`, splices imports, then applies `##KEY##` replacements.
     * @param framework The framework. Its graphics device must already expose a WebGPU device.
     * @param id Key in {@link WgslShaderModuleContent}, for example `unlit_material` or `main_frame_buffer`.
     * @param keyValueDictionary Optional `##KEY##` names to numbers. By default, omitted, so no token is replaced.
     * A key that is absent has no default number.
     */
    public constructor(framework: IFramework, id: string, keyValueDictionary?: {[id: string]: number}) {
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
        const device = (framework.renderer.graphicsDevice as WebGpuGraphicsDevice).device;
        this._gpuShaderModule = WebGpuUtilities.shaderModule.create(device, code, id);
        this.label = id;
    }

    /**
     * The shader id passed to the constructor. This is also the GPU shader module label.
     */
    public readonly label: string;

    /** @inheritDoc */
    public readonly stages: ShaderStage[] = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];

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
     * The native shader module, or null after {@link dispose}.
     */
    public get nativeHandle(): any {
        return this._gpuShaderModule;
    }

    /**
     * Drops the native shader module. {@link gpuShaderModule} throws after this.
     * Calling it again leaves the field null.
     */
    public dispose(): void {
        this._gpuShaderModule = null;
    }

    /**
     * WGSL source registered for an import path.
     * Uses {@link _modules} when this path was already resolved. Does not modify {@link WgslShaderModuleContent}.
     * @param path The path inside `#import "path"`, for example `modules/color_conversion.wgsl`.
     * @returns That entry's `shader` text.
     * @throws `Module "<path>" not found.` when no entry has this `path`, or that entry's `shader` is absent.
     */
    private _loadModule(path: string): string {
        const cached = this._modules[path];
        if (cached?.shader !== undefined) {
            return cached.shader;
        }

        for (const id in WgslShaderModuleContent) {
            const entry = WgslShaderModuleContent[id];
            if (entry.path === path && entry.shader !== undefined) {
                this._modules[path] = entry;
                return entry.shader;
            }
        }

        throw new Error(`Module "${path}" not found.`);
    }

    /**
     * Replaces each full-line `#import "path"` with that module's source.
     * A path already in `seen` is removed instead of inserted again, which also stops a cycle.
     * Nested imports use the same set. `##KEY##` tokens are not replaced here.
     * @param source Shader or module source that may contain import lines.
     * @param seen Paths already inserted. By default, a new empty set.
     * @returns `source` with import directives expanded or removed.
     * @throws `Module "<path>" not found.` when an import path is not registered.
     */
    private _injectModules(source: string, seen?: Set<string>): string {
        const included = seen ?? new Set<string>();
        const pattern = new RegExp(this._moduleRegex.source, this._moduleRegex.flags);
        const matches = [...source.matchAll(pattern)];
        if (matches.length === 0) {
            return source;
        }

        let result = "";
        let cursor = 0;
        for (const match of matches) {
            const index = match.index ?? 0;
            result += source.slice(cursor, index);
            const path = match[1];
            if (path !== undefined && !included.has(path)) {
                included.add(path);
                result += this._injectModules(this._loadModule(path), included);
            }
            cursor = index + match[0].length;
        }
        result += source.slice(cursor);
        return result;
    }
}
