import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {type IFramework, type IShaderModule, ShaderStage} from "../../api";
import {GlslShaderModuleContent, type InternalShader} from "../../api/content/ShaderModuleContent.ts";


const MODULE_INCLUDE_KEYWORD = "#include";

/**
 * The WebGL shader module: a linked GLSL program built from a {@link GlslShaderModuleContent} entry.
 * Expands full-line `#include "path"` lines, then replaces `##KEY##` tokens.
 */
export class WebGlShaderModule implements IShaderModule {

    private readonly _graphicsDevice: WebGlGraphicsDevice;
    private readonly _gl: WebGL2RenderingContext;
    /** Resolved include paths, cached on this instance. By default, empty. The shared registry is not modified. */
    private readonly _modules: { [path: string]: InternalShader } = {};
    private readonly _moduleRegex = new RegExp(
        `^\\s*${MODULE_INCLUDE_KEYWORD}\\s+"([^"]+)"\\s*;?\\s*$`,
        "gm",
    );
    private _program?: WebGLProgram;

    /**
     * The constructor of the WebGL shader module. Compiles and links the program.
     * @param framework The framework. Its graphics device must be a WebGL2 device.
     * @param shaderFilePath Key in {@link GlslShaderModuleContent}, for example `unlit_material`.
     * @param keyValueDictionary Optional `##KEY##` names to numbers. By default, omitted, so no token is replaced.
     * @throws Error when the shader id or an `#include` is unknown, or compiling or linking fails.
     */
    public constructor(framework: IFramework, shaderFilePath: string, keyValueDictionary?: { [id: string]: number }) {
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGlGraphicsDevice;
        this._gl = this._graphicsDevice.gl;
        this._program = this._loadShaders(shaderFilePath, keyValueDictionary);
    }

    /** @inheritDoc */
    public stages: ShaderStage[] = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];

    /** @inheritDoc */
    public nativeHandle?: any;

    /**
     * The linked WebGL program of this shader module. Undefined after {@link dispose}.
     */
    public get program(): WebGLProgram | null | undefined {
        return this._program;
    }

    /**
     * Loads the included GLSL source for `path`.
     * @param path The path inside `#include "path"`.
     * @returns That entry's `shader` text.
     * @throws Error when no entry has this `path`, or its `shader` is absent.
     * @private
     */
    private _loadModule(path: string): string {

        const cached = this._modules[path];
        if (cached?.shader !== undefined) {
            return cached.shader;
        }

        for (const id in GlslShaderModuleContent) {
            const module = GlslShaderModuleContent[id];
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
    private _injectModules(shaderSource: string): string {

        let match : RegExpExecArray | null = null;
        while ((match = this._moduleRegex.exec(shaderSource)) !== null) {
            const modulePath = match[1];
            const module = this._loadModule(modulePath);
            shaderSource = shaderSource.replace(this._moduleRegex, module);
        }

        return shaderSource;
    }

    /**
     * Builds the program for `shaderFilePath`: expands includes, replaces `##KEY##` tokens, compiles and links.
     * @param shaderFilePath Key in {@link GlslShaderModuleContent}.
     * @param keyValueDictionary Optional replacements. By default, omitted.
     * @returns The linked program.
     * @private
     */
    private _loadShaders(shaderFilePath: string, keyValueDictionary?: { [id: string]: number }): WebGLProgram {

        const internalShader = GlslShaderModuleContent[shaderFilePath];

        let vertexShaderSource = "";
        let fragmentShaderSource = "";
        if (internalShader) {
            const vertexSource = internalShader.vertex;
            const fragmentSource = internalShader.fragment;
            if (!vertexSource) {
                throw new Error(`WebGlShaderModule: the vertex shader source is missing for '${shaderFilePath}'.`);
            }
            if (!fragmentSource) {
                throw new Error(`WebGlShaderModule: the fragment shader source is missing for '${shaderFilePath}'.`);
            }
            vertexShaderSource = vertexSource;
            fragmentShaderSource = fragmentSource;

            vertexShaderSource = this._injectModules(vertexShaderSource);
            fragmentShaderSource = this._injectModules(fragmentShaderSource);

        } else {

            throw new Error(`WebGlShaderModule: GLSL shader '${shaderFilePath}' is not a built-in shader (GlslShaderModuleContent); loading shaders from files is not implemented for WebGL2 yet.`);

            // TODO: THIS API SUCKS, WE NEED BETTER WAY TO LOAD SHADER

            // TODO: this is not complete we need to determine how it will be loaded from files.
            // Most likely content pipeline will be source of truth
            // vertexShaderSource = await this._shaderLoader.load(shaderFilePath, RenderingBackend.WEB_GL, [ShaderStage.VERTEX]);
            // fragmentShaderSource = await this._shaderLoader.load(shaderFilePath, RenderingBackend.WEB_GL, [ShaderStage.FRAGMENT]);
        }

        if (keyValueDictionary) {
            for (const key in keyValueDictionary) {
                vertexShaderSource = vertexShaderSource.replace(`##${key}##`, String(keyValueDictionary[key]));
                fragmentShaderSource = fragmentShaderSource.replace(`##${key}##`, String(keyValueDictionary[key]));
            }
        }

        const vertexShader = WebGlUtilities.shader.createVertexShader(this._gl, vertexShaderSource);
        const fragmentShader = WebGlUtilities.shader.createFragmentShader(this._gl, fragmentShaderSource);

        const program = WebGlUtilities.program.create(this._gl, vertexShader, fragmentShader);

        // Clean up shaders after linking.
        this._gl.deleteShader(vertexShader);
        this._gl.deleteShader(fragmentShader);

        return program;
    }

    /** @inheritdoc */
    public dispose(): void {

        if (this._program) {
            this._gl.deleteProgram(this._program);
            this._program = undefined;
        }
    }
}

export default WebGlShaderModule