import {RenderingBackend, type ShaderStage} from "../index.ts";

/** Loads shader source files over `fetch`. */
export class ShaderLoader {

    /**
     * Loads the shader source code from the given shader file path for the specified rendering backend and shader stages.
     * @param shaderFilePath The shader file path.
     * @param renderingBackend The rendering backend.
     * @param stages The shader stages. For WebGL, only one shader stage is allowed. For WebGPU, multiple shader stages are allowed.
     * @returns The shader source code.
     */
    public async load(shaderFilePath: string, renderingBackend: RenderingBackend, stages: ShaderStage[]): Promise<string> {

        if(stages.length === 0) {
            throw new Error(`ShaderLoader.load("${shaderFilePath}"): stages is empty; at least one shader stage must be specified.`);
        }

        if(renderingBackend === RenderingBackend.WEB_GL) {
            if(stages.length > 1) {
                throw new Error(`ShaderLoader.load("${shaderFilePath}"): WebGL does not support multiple shader stages in a single file; got ${stages.length} stages.`);
            }
        }

        const shaderSource = await fetch(shaderFilePath);
        return await shaderSource.text();
    }
}
