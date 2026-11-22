import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";
import {type IFramework, ShaderStage} from "../../api";
import {WgslShaderModuleContent, type InternalShader} from "../../api/content/ShaderModuleContent.ts";
import { AShaderModule } from "../../api/shader/AShaderModule.ts";



/**
 * The WebGPU shader module: WGSL modules built from a {@link WgslShaderModuleContent} entry.
 * Expands full-line `#include "path"` lines, then replaces `##KEY##` tokens.
 * Render programs use {@link shader}; compute programs use {@link compute}.
 * @internal
 */
export class WebGpuShaderModule extends AShaderModule {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;

    private _shader?: GPUShaderModule;
    private _compute?: GPUShaderModule;

    /**
     * The constructor of the WebGPU shader module. Creates the GPU shader modules.
     * @param framework The framework. Its graphics device must be a WebGPU device.
     * @param shaderFilePath Key in {@link WgslShaderModuleContent}, for example `unlit_material`.
     * @param keyValueDictionary Optional `##KEY##` names to numbers. By default, omitted, so no token is replaced.
     * @throws Error when the shader id or an `#include` is unknown, or both `shader` and `compute` sources are missing.
     */
    public constructor(framework: IFramework, shaderFilePath: string, keyValueDictionary?: { [id: string]: number }) {
        super();
        this._graphicsDevice = framework.graphicsDevice as WebGpuGraphicsDevice;
        this._loadShaders(shaderFilePath, keyValueDictionary);
    }

    /** @inheritdoc */
    protected shaderModuleContent: { [id: string]: InternalShader; } = WgslShaderModuleContent;

    /**
     * The GPU shader module with the vertex and fragment entry points. Undefined when the content has no `shader`, or after {@link dispose}.
     */
    public get shader(): GPUShaderModule | undefined {
        return this._shader;
    }

    /**
     * The GPU shader module with the compute entry point. Undefined when the content has no `compute`, or after {@link dispose}.
     */
    public get compute(): GPUShaderModule | undefined {
        return this._compute;
    }
    
    /**
     * Replaces each full-line `#include "path"` with that module's source.
     * A path is inserted once. A repeat, including through nesting or a cycle, is removed.
     * @param shaderSource The shader source.
     * @param seen Paths already inserted. By default, a new empty set.
     * @returns The source with modules.
     * @protected
     */
    protected override _injectModules(shaderSource: string, seen: Set<string> = new Set()): string {
        const pattern = new RegExp(this._moduleRegex.source, this._moduleRegex.flags);
        let result = "";
        let cursor = 0;

        for (const match of shaderSource.matchAll(pattern)) {
            const path = match[1];
            const index = match.index!;
            result += shaderSource.slice(cursor, index);
            if (path !== undefined && !seen.has(path)) {
                seen.add(path);
                result += this._injectModules(this._loadModule(path), seen);
            }
            cursor = index + match[0].length;
        }

        return result + shaderSource.slice(cursor);
    }

    /**
     * Builds the GPU shader modules for `shaderFilePath`: expands includes, replaces `##KEY##` tokens, and creates the modules.
     * @param shaderFilePath Key in {@link WgslShaderModuleContent}.
     * @param keyValueDictionary Optional replacements. By default, omitted.
     * @private
     */
    private _loadShaders(shaderFilePath: string, keyValueDictionary?: { [id: string]: number }): void {

        const internalShader = WgslShaderModuleContent[shaderFilePath];

        if (!internalShader) {
            throw new Error(`WebGpuShaderModule: WGSL shader '${shaderFilePath}' is not a built-in shader (WgslShaderModuleContent); loading shaders from files is not implemented for WebGPU yet.`);
        }

        let shaderSource = internalShader.path === undefined ? internalShader.shader : undefined;
        let computeSource = internalShader.compute;

        if (shaderSource === undefined && computeSource === undefined) {
            throw new Error(`WebGpuShaderModule: the shader and compute sources are missing for '${shaderFilePath}'.`);
        }

        if (shaderSource !== undefined) {
            shaderSource = this._injectModules(shaderSource);
        }
        if (computeSource !== undefined) {
            computeSource = this._injectModules(computeSource);
        }

        if (keyValueDictionary) {
            for (const key in keyValueDictionary) {
                const value = String(keyValueDictionary[key]);
                if (shaderSource !== undefined) {
                    shaderSource = shaderSource.split(`##${key}##`).join(value);
                }
                if (computeSource !== undefined) {
                    computeSource = computeSource.split(`##${key}##`).join(value);
                }
            }
        }

        const device = this._graphicsDevice.device;
        if (shaderSource !== undefined) {
            this._shader = WebGpuUtilities.shaderModule.create(device, shaderSource, shaderFilePath);
            this.stages = [ShaderStage.VERTEX, ShaderStage.FRAGMENT]
        }
        if (computeSource !== undefined) {
            this._compute = WebGpuUtilities.shaderModule.create(device, computeSource, shaderFilePath);
            this.stages = [ShaderStage.COMPUTE];
        }

        if (this._shader !== undefined && this._compute !== undefined) {
            this.stages = [ShaderStage.VERTEX, ShaderStage.FRAGMENT, ShaderStage.COMPUTE];
        } else if (this._compute !== undefined) {
            this.stages = [ShaderStage.COMPUTE];
        }

        if (this._shader !== undefined) {
            this.nativeHandle = this._shader;
        } else {
            this.nativeHandle = this._compute;
        }
    }

    /** @inheritdoc */
    public dispose(): void {

        this._shader = undefined;
        this._compute = undefined;
        this.nativeHandle = undefined;
    }
}

export default WebGpuShaderModule
