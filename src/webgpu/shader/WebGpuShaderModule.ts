import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import {WgslShaderModuleContent} from "../../api/content/WgslShaderModuleContent.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

/**
 * A full-line WGSL import.
 * Optional spaces or tabs around the directive, then `#import`, then a double-quoted path, then an optional semicolon.
 * Single quotes are not an import. The path is group 1 and must match {@link WgslShaderModuleEntry.path}.
 */
const IMPORT_PATTERN = /^[ \t]*#import[ \t]+"([^"]+)"[ \t]*;?[ \t]*$/gm;

/**
 * A WGSL shader module. One module holds both stages (`main_vs` and `main_fs`).
 *
 * Before the GPU shader module is created, each full-line `#import "path"` is replaced from
 * {@link WgslShaderModuleContent}. A path is inserted once; a later import of that same path is removed.
 * Imports inside an included module are expanded the same way. A cycle stops when a path is seen again,
 * so each module in the cycle is copied once. Module text is copied literally (`$` sequences are not patterns).
 * After imports, each `##KEY##` listed in `keyValueDictionary` is replaced with that number's decimal text,
 * every time it occurs. A token whose key is absent is left unchanged. When `keyValueDictionary` is omitted,
 * no `##KEY##` replacement runs.
 *
 * Unknown program ids, and entries that are modules (`path` set), throw
 * `WGSL shader '<id>' is not implemented for WebGPU.` A missing import path throws `Module "<path>" not found.`
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
     * Loads the built-in shader `id`, splices `#import` lines, then applies `##KEY##` replacements.
     * @param framework The framework. Its graphics device must already expose a WebGPU device.
     * @param id Program id in {@link WgslShaderModuleContent}, for example `unlit_material` or `main_frame_buffer`.
     * A module id such as `color_conversion` is not a program.
     * @param keyValueDictionary Optional map of `##KEY##` names to numbers. By default, omitted, so no token is replaced.
     * There is no default number for a key that is missing from the map.
     */
    public constructor(framework: IFramework, id: string, keyValueDictionary?: {[id: string]: number}) {
        let code = WebGpuShaderModule._programSource(id);
        code = WebGpuShaderModule._injectModules(code);
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
     * @throws When {@link dispose} has already cleared it.
     */
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

    /**
     * Drops the native shader module. {@link gpuShaderModule} throws after this.
     * Calling it again is safe: the field stays null.
     */
    public dispose(): void {
        this._gpuShaderModule = null;
    }

    /**
     * The raw program source for `id`, still containing any `#import` lines.
     * @param id Program id in {@link WgslShaderModuleContent}.
     * @returns That entry's `shader` text.
     * @throws `WGSL shader '<id>' is not implemented for WebGPU.` when `id` is missing,
     * the entry is a module (`path` is set), or `shader` is absent.
     */
    private static _programSource(id: string): string {
        const entry = WgslShaderModuleContent[id];
        const shader = entry?.shader;
        if (entry === undefined || entry.path !== undefined || shader === undefined) {
            throw new Error(`WGSL shader '${id}' is not implemented for WebGPU.`);
        }
        return shader;
    }

    /**
     * WGSL source registered for an import path.
     * Does not modify {@link WgslShaderModuleContent}.
     * @param path The path inside `#import "path"`, for example `modules/color_conversion.wgsl`.
     * The content id is not a path: `#import "color_conversion"` does not resolve.
     * @returns The matching entry's `shader` text.
     * @throws `Module "<path>" not found.` when no entry has this `path`, or that entry's `shader` is absent.
     */
    private static _moduleSource(path: string): string {
        for (const id in WgslShaderModuleContent) {
            const entry = WgslShaderModuleContent[id];
            if (entry.path === path && entry.shader !== undefined) {
                return entry.shader;
            }
        }
        throw new Error(`Module "${path}" not found.`);
    }

    /**
     * Replaces each full-line `#import "path"` with that module's source.
     * A path already in `seen` is removed instead of inserted again, which is also what stops a cycle.
     * Nested imports are expanded with the same set. Text is copied with slices, not `String.replace`.
     * The registry is not modified. `##KEY##` tokens are not replaced here.
     * @param source Shader or module source that may contain import lines.
     * @param seen Paths already inserted. By default, a new empty set, so the first call tracks the whole shader.
     * Nested calls pass the same set.
     * @returns `source` with import directives expanded or removed.
     * @throws `Module "<path>" not found.` when an import path is not registered.
     */
    private static _injectModules(source: string, seen?: Set<string>): string {
        const included = seen ?? new Set<string>();
        const matches = [...source.matchAll(new RegExp(IMPORT_PATTERN.source, "gm"))];
        if (matches.length === 0) {
            return source;
        }

        let result = "";
        let cursor = 0;
        for (const match of matches) {
            const index = match.index ?? 0;
            result += source.slice(cursor, index);
            const path = match[1];
            if (!included.has(path)) {
                included.add(path);
                result += WebGpuShaderModule._injectModules(WebGpuShaderModule._moduleSource(path), included);
            }
            cursor = index + match[0].length;
        }
        result += source.slice(cursor);
        return result;
    }
}
