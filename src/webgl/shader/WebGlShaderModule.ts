import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {type IFramework, type IShaderModule, ShaderStage} from "../../api";
import {GlslShaderModuleContent, type InternalShader} from "../../api/content/ShaderModuleContent.ts";


const MODULE_INCLUDE_KEYWORD = "#include";

/**
 * The WebGL shader module.
 */
export class WebGlShaderModule implements IShaderModule {

    private readonly _graphicsDevice: WebGlGraphicsDevice;
    private readonly _gl: WebGL2RenderingContext;
    private readonly _modules: { [id: string]: InternalShader } = {};
    private readonly _moduleRegex = new RegExp(
        `^\\s*${MODULE_INCLUDE_KEYWORD}\\s+"([^"]+)"\\s*;?\\s*$`,
        "gm",
    );
    private _program?: WebGLProgram;

    /**
     * The constructor of the WebGL shader module.
     * @param framework The framework.
     * @param shaderFilePath
     * @param keyValueDictionary
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
     * The program of this shader module
     */
    public get program(): WebGLProgram | null | undefined {
        return this._program;
    }

    /**
     * Loads the shader module code from path.
     * @param path The path.
     * @private
     */
    private _loadModule(path: string): string {

        let module = this._modules[path];

        if (module) {
            if (module.shader === undefined) {
                throw new Error(`Module "${path}" not found.`);
            }
            return module.shader;
        }

        for (const id in GlslShaderModuleContent) {
            module = GlslShaderModuleContent[id];
            (module as unknown as Record<string, InternalShader>)[path] = module;
            if (module.path === path) {
                if (module.shader === undefined) {
                    throw new Error(`Module "${path}" not found.`);
                }
                return module.shader;
            }
        }

        throw new Error(`Module "${path}" not found.`);
    }

    /**
     * Injects modules to the shader.
     * @param shaderSource The shader source.
     * @private The source with modules.
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

    private _loadShaders(shaderFilePath: string, keyValueDictionary?: { [id: string]: number }): WebGLProgram {

        const internalShader = GlslShaderModuleContent[shaderFilePath];

        let vertexShaderSource = "";
        let fragmentShaderSource = "";
        if (internalShader) {
            const vertexSource = internalShader.vertex;
            const fragmentSource = internalShader.fragment;
            if (!vertexSource) {
                throw new Error(`Vertex shader source is missing for ${shaderFilePath}.`);
            }
            if (!fragmentSource) {
                throw new Error(`Fragment shader source is missing for ${shaderFilePath}.d`)
            }
            vertexShaderSource = vertexSource;
            fragmentShaderSource = fragmentSource;

            vertexShaderSource = this._injectModules(vertexShaderSource);
            fragmentShaderSource = this._injectModules(fragmentShaderSource);

        } else {

            throw new Error("Not implemented");

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