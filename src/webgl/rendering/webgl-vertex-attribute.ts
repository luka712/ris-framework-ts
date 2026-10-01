
/**
 * The WebGL implementation of a vertex attribute.
 */
export class WebGLVertexAttribute {
    constructor(
        public gl: WebGL2RenderingContext,
    ) {

    }

    /** @inheritdoc */
    initialize(): void {
        // No initialization is needed for WebGL vertex attributes.
    }
}