import type {IBlendState, IFramework, IIndexBuffer, IPrimitiveState, IRenderPipeline, IVertexBuffer} from "ris-framework-api";
import type {VertexBufferLayout} from '../../core/rendering/vertex-buffer-layout';
import type {WebGlBlendState} from '../blending/webgl-blend-state';
import type {WebGlPrimitiveState} from '../primitive/WebGlPrimitiveState.ts';
import type {WebGlSampler} from '../sampler/webgl-sampler';
import {WebGlConverter} from '../utilities/WebGlConverter.ts';
import type {WebGlGraphicsDevice} from "../WebGlGraphicsDevice.ts";

/**
 * The base class for WebGL render pipelines. This class provides common functionality for all WebGL render pipelines.
 */
export abstract class AWebGlRenderPipeline implements IRenderPipeline {

    /** The framework instance. */
    protected readonly _framework: IFramework;
    protected readonly _gl: WebGL2RenderingContext;
    protected readonly _defaultTextureSampler: WebGlSampler;
    protected readonly _blendState: WebGlBlendState;
    protected _vertexArrayObject: WebGLVertexArrayObject | null = null;


    protected _program: WebGLProgram = null!;

    /**
     * The constructor.
     * @param framework The framework.
     * @param primitiveState The primitive state.
     */
    public constructor(framework: IFramework, primitiveState?: IPrimitiveState) {
        this._framework = framework;
        const graphicsDevice = framework.renderer.graphicsDevice as WebGlGraphicsDevice;
        this._gl = graphicsDevice.gl;
        this._blendState = graphicsDevice.defaultBlendState as WebGlBlendState;
        this._defaultTextureSampler = graphicsDevice.defaultTextureSampler as WebGlSampler;
        this.primitiveState = (primitiveState ?? graphicsDevice.defaultPrimitiveState) as WebGlPrimitiveState;
    }

    /** @inheritDoc */
    public get blendState(): IBlendState {
        return this._blendState;
    }

    /** @inheritDoc */
    public readonly primitiveState: WebGlPrimitiveState;

    /** @inheritDoc */
    public render(
        _vertexBuffer: IVertexBuffer,
        _indexBuffer: IIndexBuffer,
        _indicesCount = -1,
        _indicesOffset = 0
    ): void {
        void _vertexBuffer;
        void _indexBuffer;
        void _indicesCount;
        void _indicesOffset;
    }


    /** @inheritDoc */
    public vertexBufferLayouts: VertexBufferLayout[] = null!;

    /**
     * Provide WebGL buffers for the render pipeline.
     * This method should be implemented by subclasses to provide the necessary buffers
     * for creatine the vertex array object.
     * @returns An array of WebGLBuffer objects to be used in the vertex array object.
     */
    protected abstract _provideBuffers(): WebGLBuffer[] | null | undefined;

    /**
     * Creates the vertex array object for the render pipeline.
     *  This method binds the provided buffers and sets up the vertex attribute pointers based on the vertex buffer layouts.
     */
    protected _createVertexArrayObject(): void {
        this._vertexArrayObject = this._gl.createVertexArray();
        const buffers = this._provideBuffers();

        if (!buffers || buffers.length === 0) {
            return;
        }

        for (let i = 0; i < this.vertexBufferLayouts.length; i++) {
            const layout = this.vertexBufferLayouts[i];
            const buffer = buffers[i];

            this._gl.bindVertexArray(this._vertexArrayObject);
            this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buffer);

            const stride = layout.arrayStride;
            for (const attribute of layout.attributes) {

                const size = WebGlConverter.convertVertexFormat(attribute.format);
                const index = attribute.shaderLocation;
                const offset = attribute.offset;

                this._gl.enableVertexAttribArray(index);
                this._gl.vertexAttribPointer(index, size, this._gl.FLOAT, false, stride, offset);
            }
        }
    }

    /**
     * Set up the pipeline state.
     *  This method should be called before rendering to set up the necessary pipeline state, such as blending, depth testing, etc.
     */
    protected _setupPipeline(): void {
        this._blendState.apply(this._gl);
    }

    /** @inheritDoc */
    public initialize(): void {

        if (!this.vertexBufferLayouts || this.vertexBufferLayouts.length === 0) {
            throw new Error('At least one vertex buffer layout must be provided for the render pipeline.');
        }

        this._createVertexArrayObject();
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._vertexArrayObject) {
            this._gl.deleteVertexArray(this._vertexArrayObject);
            this._vertexArrayObject = null;
        }
    }

}