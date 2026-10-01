import type { TextureFormat } from "ris-framework-api";
import { SpectorJSUtilities } from "./spector-js-utilities";
import { WebGlConverter } from "./WebGlConverter.ts";

/**
 * The utility class for WebGL render buffer operations. It provides methods for creating render buffers with specified formats, dimensions, and labels. Render buffers are used in WebGL for off-screen rendering, particularly for depth and stencil attachments in framebuffers. This class abstracts the details of creating and configuring render buffers, making it easier to manage them in a WebGL application.
 */
export class WebGLRenderbufferUtilities {
    /**
     * Creates a render buffer with the specified internal format, width, height, and label.
     * @param gl The WebGL2 rendering context.
     * @param internalFormat The internal format of the render buffer, which determines the type of data stored in the buffer (e.g., depth, stencil, or depth-stencil).
     * @param width The width of the render buffer in pixels.
     * @param height The height of the render buffer in pixels.
     * @param label The label of the render buffer, which can be used for debugging purposes. It is optional and can be null or undefined.
     * @returns The created WebGLRenderbuffer object.
     */
    public create(gl: WebGL2RenderingContext, internalFormat: TextureFormat, width: number, height: number, label: string | null | undefined): WebGLRenderbuffer {
        const intFormat = WebGlConverter.convertInternalFormat(gl, internalFormat);

        const renderBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER,
            intFormat,
            width,
            height);

        if (label) {
            SpectorJSUtilities.setLabel(renderBuffer, label);
        }

        return renderBuffer;
    }

}