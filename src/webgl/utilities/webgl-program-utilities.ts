/**
 * This module provides utility functions for working with WebGL programs, such as creating and linking shader programs.
 */
export class WebGLProgramUtilities {

    /**
     * Creates a WebGL program with the given vertex shader and fragment shader.
     * @param gl The WebGL2 rendering context.
     * @param vertexShader The vertex shader to be attached to the program.
     * @param fragmentShader The fragment shader to be attached to the program.
     * @returns The linked WebGLProgram object.
     */
    public create(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = gl.createProgram();
        if (!program) {
            throw new Error("Failed to create program.");
        }
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const infoLog = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Failed to link program: ${infoLog}`);
        }
        return program;
    }

}