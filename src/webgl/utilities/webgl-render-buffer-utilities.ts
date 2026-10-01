import type { TextureFormat } from "ris-framework-api";
import { WebGlConverter } from "./WebGlConverter.ts";

export class WebGLRenderBufferUtilities {


    public create(gl: WebGL2RenderingContext, internalFormat: TextureFormat, width: number, height: number, label: string | null = null): WebGLRenderbuffer {

        const glFormat = WebGlConverter.convertInternalFormat(gl, internalFormat);
        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER,
            glFormat,
            width,
            height);

        if (label !== null && label !== undefined && label !== "") {
            (renderBuffer as any).__SPECTOR_Metadata = { name: label };
        }

        return renderBuffer;
    }
}