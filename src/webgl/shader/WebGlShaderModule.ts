import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";
import {WebGlUtilities} from "../utilities/WebGlUtilities.ts";
import {type IFramework, type IShaderModule, ShaderStage} from "../../api/index.ts";
import {ShaderModuleContent} from "../../api/content/ShaderModuleContent.ts";

interface WebGlInternalShader {
    vertex: string;
    fragment: string;
    reflection: any; // This will be type in the future.
}

/**
 * The WebGL shader module.
 */
export class WebGlShaderModule implements IShaderModule {

    private readonly _graphicsDevice: WebGlGraphicsDevice;
    private readonly _gl: WebGL2RenderingContext;
    private _program?: WebGLProgram;

    /**
     * The constructor of the WebGL shader module.
     * @param framework The framework.
     * @param shaderFilePath
     */
    public constructor(framework: IFramework, shaderFilePath: string) {
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGlGraphicsDevice;
        this._gl = this._graphicsDevice.gl;
        this._program = this._loadShaders(shaderFilePath);

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
        if (ShaderModuleContent[id]) {
            
            this.stages = [ShaderStage.VERTEX, ShaderStage.FRAGMENT];
            
            return {
                vertex: ShaderModuleContent[id]["vertex"],
                fragment: ShaderModuleContent[id]["fragment"],
                reflection: ShaderModuleContent[id]["reflection"],
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

    private _loadShaders(shaderFilePath: string): WebGLProgram {

        const internalShader = this._tryResolveFrameworkShader(shaderFilePath);

        let vertexShaderSource = "";
        let fragmentShaderSource = "";
        if (internalShader) {
            vertexShaderSource = internalShader.vertex;
            fragmentShaderSource = internalShader.fragment;
        } else {

            throw new Error("Not implemented");

            // TODO: THIS API SUCKS, WE NEED BETTER WAY TO LOAD SHADER

            // TODO: this is not complete we need to determine how it will be loaded from files.
            // Most likely content pipeline will be source of truth
            // vertexShaderSource = await this._shaderLoader.load(shaderFilePath, RenderingBackend.WEB_GL, [ShaderStage.VERTEX]);
            // fragmentShaderSource = await this._shaderLoader.load(shaderFilePath, RenderingBackend.WEB_GL, [ShaderStage.FRAGMENT]);
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