import { Culling } from "../../core/renderer/enums";
import { WebGlConverter } from "./WebGlConverter.ts";

/**
 * The WebGL culling utilities.
 */
export class WebGLCullingUtilities {

    /**
     * Sets the culling mode.
     * @param gl The WebGL2RenderingContext.
     * @param culling The culling mode.
     */
    public setCulling(gl: WebGL2RenderingContext, culling: Culling) {
        if (culling == Culling.None) {
            gl.disable(gl.CULL_FACE);
        }
        else {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(WebGlConverter.convertCulling(gl, culling));
        }
    }
}