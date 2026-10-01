
/**
 * This module provides utility functions for working with WebGL shaders, including shader creation and compilation.
 */
export class WebGlShaderUtilities {

    /**
     * Creates a WebGL shader of the specified type using the provided shader source code.
     * @param gl The WebGL2 rendering context.
     * @param shaderSource The source code of the shader.
     * @param shaderType The type of the shader (e.g., gl.VERTEX_SHADER or gl.FRAGMENT_SHADER).
     * @returns The compiled WebGLShader object.
     */
    public create(gl: WebGL2RenderingContext, shaderSource: string ,shaderType : GLenum): WebGLShader {
        const shader = gl.createShader(shaderType);
        if (!shader) {
            throw new Error("Failed to create shader.");
        }
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const infoLog = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Failed to compile shader: ${infoLog}`);
        }
        return shader;
    }

    /**
     * Creates a vertex shader using the provided shader source code.
     * @param gl The WebGL2 rendering context.
     * @param shaderSource The source code of the vertex shader.
     * @returns The compiled WebGLShader object representing the vertex shader.
     */
    public createVertexShader(gl: WebGL2RenderingContext, shaderSource: string): WebGLShader {
       return this.create(gl, shaderSource, gl.VERTEX_SHADER);
    }

    /**
     * Creates a fragment shader using the provided shader source code.
     * @param gl The WebGL2 rendering context.
     * @param shaderSource The source code of the fragment shader.
     * @returns The compiled WebGLShader object representing the fragment shader.
     */
    public createFragmentShader(gl: WebGL2RenderingContext, shaderSource: string): WebGLShader {
        return this.create(gl, shaderSource, gl.FRAGMENT_SHADER);
    }
}
