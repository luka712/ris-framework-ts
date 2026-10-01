export class SpectorJSUtilities {

    /**
     * Sets the label for a WebGL object to be used by Spector.js.
     * @param target The WebGL object to set the label for (e.g., WebGLBuffer, WebGLTexture, WebGLFramebuffer, etc.).
     * @param label The label to set for the WebGL object. This will be displayed in Spector.js for easier identification.
     */
    public static setLabel(target: any, label: string): void {
        if (target) {
            (target as any).__SPECTOR_Metadata = { name: label };
        }
    }
}