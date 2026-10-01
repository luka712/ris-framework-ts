/**
 * The WebGL implementation of a vertex buffer layout.
 */
export class WebGLVertexBufferLayout {

    private readonly _gl: WebGL2RenderingContext;
    private _bufferTarget: number = 0;

    /**
     * The constructor for the WebGLVertexBufferLayout class.
     * @param gl The WebGL2 rendering context.
     * @param buffer The WebGL buffer that is used to store the vertex data. This is used to determine the buffer target for the vertex buffer layout.
     * @param bufferTarget The buffer target for the vertex buffer layout. This is used to determine how the vertex buffer is bound to the WebGL context. This is typically either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER.
     */
    constructor(
        gl: WebGL2RenderingContext,
        buffer: WebGLBuffer,
        bufferTarget: number
    ) {
        this._gl = gl;
        this.buffer = buffer;
        this._bufferTarget = bufferTarget;
    }

    /**
     * The WebGL buffer that is used to store the vertex data.
     */
    public buffer: WebGLBuffer | null = null;

    /**
     * Binds the vertex buffer to the WebGL context using the buffer target specified in the constructor.
     */
    public bindBuffer(): void {
        this._gl.bindBuffer(this._bufferTarget, this.buffer);
    }

    /**
     * Initializes the vertex buffer layout. This method should be called after the buffer has been created and bound.
     */
    public initialize(): void {
        this._gl.bindBuffer(this._bufferTarget, this.buffer);

        /*
        for (const attribute of this.attributes) {

            const index = attribute.shaderLocation;
            const size = WebGLConverter.convertVertexFormat(attribute.vertexFormat);
            const stride = this.arrayStride;
            const offset = attribute.offset;

            this._gl.enableVertexAttribArray(index);
            this._gl.vertexAttribPointer(
                index,
                size,
                this._gl.FLOAT, // Assuming all vertex formats are float for simplicity. In a complete implementation, this should be determined based on the vertex format.
                false,
                stride,
                offset
            );
        }

         */
    }
}