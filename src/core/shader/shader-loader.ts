import {RenderingBackend, type ShaderStage} from "ris-framework-api";

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
            throw new Error("At least one shader stage must be specified.");
        }

        if(renderingBackend === RenderingBackend.WEB_GL) {
            if(stages.length > 1) {
                throw new Error("WebGL does not support multiple shader stages in a single file.");
            }
        }

        const shaderSource = await fetch(shaderFilePath);
        return await shaderSource.text();
    }
}
