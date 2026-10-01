/**
 * The utility class for WebGL blending operations.
 */
export class WebGLBlendingUtilities {
    /**
     * Enables blending with the specified parameters.
     * @param gl The WebGL2RenderingContext context.
     * @param colorFunc The color function. By default, it is FUNC_ADD.
     * @param srcColorFactor The source color factor. By default, it is SRC_ALPHA.
     * @param dstColorFactor The destination color factor. By default, it is ONE_MINUS_SRC_ALPHA.
     * @param alphaFunc The alpha function. By default, it is FUNC_ADD.
     * @param srcAlphaFactor The source alpha factor. By default, it is SRC_ALPHA.
     * @param dstAlphaFactor The destination alpha factor. By default, it is ONE_MINUS_SRC_ALPHA.
     */
    public enableBlend(
        gl: WebGL2RenderingContext,
        colorFunc: number | null = null,
        srcColorFactor: number | null = null,
        dstColorFactor: number | null = null,
        alphaFunc: number | null = null,
        srcAlphaFactor: number | null = null,
        dstAlphaFactor: number | null = null,
    ): void {
        colorFunc = colorFunc ?? gl.FUNC_ADD;
        srcColorFactor = srcColorFactor ?? gl.SRC_ALPHA;
        dstColorFactor = dstColorFactor ?? gl.ONE_MINUS_SRC_ALPHA;
        alphaFunc = alphaFunc ?? gl.FUNC_ADD;
        srcAlphaFactor = srcAlphaFactor ?? gl.SRC_ALPHA;
        dstAlphaFactor = dstAlphaFactor ?? gl.ONE_MINUS_SRC_ALPHA;

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(
            srcColorFactor,
            dstColorFactor,
            srcAlphaFactor,
            dstAlphaFactor,
        );
        gl.blendEquationSeparate(colorFunc, alphaFunc);
    }


    /*
    public setBlend(
        gl: WebGL2RenderingContext,
        blendState: WebGlBlendState,
    ): void {
        if (!blendState.blendingEnabled) {
            gl.disable(gl.BLEND);
            return;
        }

        const color = blendState.color;
        const alpha = blendState.alpha;
        const colorFunc = WebGLConverter.convertBlendOperation(gl, color.operation);
        const alphaFunc = WebGLConverter.convertBlendOperation(gl, alpha.operation);
        const srcAlphaFactor = WebGLConverter.convertBlendFactor(
            gl,
            alpha.srcFactor,
        );
        const dstAlphaFactor = WebGLConverter.convertBlendFactor(
            gl,
            alpha.dstFactor,
        );
        const srcColorFactor = WebGLConverter.convertBlendFactor(
            gl,
            color.srcFactor,
        );
        const dstColorFactor = WebGLConverter.convertBlendFactor(
            gl,
            color.dstFactor,
        );

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(
            srcColorFactor,
            dstColorFactor,
            srcAlphaFactor,
            dstAlphaFactor,
        );
        gl.blendEquationSeparate(colorFunc, alphaFunc);
    }


     */
}
