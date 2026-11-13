
/**
 * The WebGL implementation of a vertex attribute.
 */
export class WebGLVertexAttribute {
    /**
     * The constructor.
     * @param gl The WebGL2 rendering context.
     */
    constructor(
        public gl: WebGL2RenderingContext,
    ) {

    }

    /** @inheritdoc */
    initialize(): void {
        // No initialization is needed for WebGL vertex attributes.
    }
}