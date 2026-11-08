import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import {WgslShaderModuleContent} from "../../api/content/WgslShaderModuleContent.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";

const IMPORT_PATTERN = /^[ \t]*#import[ \t]+"([^"]+)"[ \t]*;?[ \t]*$/gm;

/**
 * A WGSL shader module. One module holds both stages (`main_vs` and `main_fs`).
 * `#import "path"` lines are replaced from {@link WgslShaderModuleContent} before `##KEY##` substitution.
 * Each import path is included once. Module text is copied literally.
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

    /**
     * Full shader source for a program id.
     * Modules (`path` set) and unknown ids are not programs.
     */
    private static _programSource(id: string): string {
        const entry = WgslShaderModuleContent[id];
        const shader = entry?.shader;
        if (entry === undefined || entry.path !== undefined || shader === undefined) {
            throw new Error(`WGSL shader '${id}' is not implemented for WebGPU.`);
        }
        return shader;
    }

    /** WGSL source of the module registered at `path`. */
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
     * A path is inserted once per shader. Later imports of the same path are removed.
     * Nested imports are expanded. The registry is not modified.
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
