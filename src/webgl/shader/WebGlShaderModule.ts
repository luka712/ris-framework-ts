import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {type IFramework, type IShaderModule, ShaderStage} from "../../api";
import {GlslShaderModuleContent} from "../../api/content/GlslShaderModuleContent.ts";


const MODULE_IMPORT_KEYWORD = "#import";

/**
 * The WebGL shader module.
 */
export class WebGlShaderModule implements IShaderModule {

    private readonly _graphicsDevice: WebGlGraphicsDevice;
    private readonly _gl: WebGL2RenderingContext;
    private readonly _modules: { [id: string]: WebGlInternalShader } = {};
    private readonly _moduleRegex = /^\s*#import\s+"([^"]+)"\s*;?\s*$/gm;
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
    public stages: ShaderStage[] = [];

    /** @inheritDoc */
    public nativeHandle?: any;

    /**
     * Tries to framework shader.
     * These shaders are part of framework.
     * @param id The id of internal shader.
     */
    private _tryResolveFrameworkShader(id: string): WebGlInternalShader | null {
        if (GlslShaderModuleContent[id]) {

            this.stages = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];

            return {
                vertex: GlslShaderModuleContent[id]["vertex"],
                fragment: GlslShaderModuleContent[id]["fragment"],
                reflection: GlslShaderModuleContent[id]["reflection"],
            }
        }

        return null;
    }

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
            return module.shader;
        }

        for (const id in GlslShaderModuleContent) {
            module = GlslShaderModuleContent[id];
            module[path] = module;
            if (module.path === path) {
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

        const internalShader = this._tryResolveFrameworkShader(shaderFilePath);

        let vertexShaderSource = "";
        let fragmentShaderSource = "";
        if (internalShader) {
            vertexShaderSource = internalShader.vertex;
            fragmentShaderSource = internalShader.fragment;

            if (!vertexShaderSource) {
                throw new Error(`Vertex shader source is missing for ${shaderFilePath}.`);
            }
            if (!fragmentShaderSource) {
                throw new Error(`Fragment shader source is missing for ${shaderFilePath}.d`)
            }

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