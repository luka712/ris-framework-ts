import type {
    IFramework, IPrimitiveState,
    ISampler,
    ITexture2D,
    IUniformBuffer, IUnlitRenderPipeline,
    IVertexBuffer
} from "ris-framework-api";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout";
import type {WebGlUniformBuffer} from "../../buffers/WebGlUniformBuffer.ts";
import { asWebGLUniformBuffer} from "../../cast/cast";
import WebGlShaderModule from "../../shader/WebGlShaderModule.ts";
import {WebGlTexture2D} from "../../texture/WebGlTexture2D.ts";
import {WebGlVertexBuffer} from '../../buffers/WebGlVertexBuffer.ts';
import {AWebGlRenderPipeline} from "../AWebGlRenderPipeline.ts";
import type {WebGLIndexBuffer} from "../../buffers/webgl-index-buffer";
import {type IIndexBuffer, IndexBufferType} from "ris-framework-api";
import type {WebGlSampler} from "../../sampler/webgl-sampler.ts";

/**
 * The WebGL implementation of the sprite render pipeline.
 */
export class WebGlUnlitRenderPipeline extends AWebGlRenderPipeline implements IUnlitRenderPipeline {

    private static readonly CAMERA_BINDING_POINT = 0;
    private static readonly  MODEL_BINDING_POINT = 1;
    private static readonly MATERIAL_BINDING_POINT = 2;

    private _texture: WebGlTexture2D = null!;
    private _sampler?: WebGlSampler;
    private _projectionViewBuffer: WebGlUniformBuffer;
    private _modelBuffer: WebGlUniformBuffer;
    private _materialBuffer: WebGlUniformBuffer;
    private _cameraBlockIndex: number = -1;
    private _modelBlockIndex: number = -1;
    private  _materialBlockIndex : number = -1;
    private _buffersArray: WebGLBuffer[] = [null!];
    private _lastVertexBuffer: WebGlVertexBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection view buffer.
     * @param modelBuffer The model buffer.
     * @param materialBuffer The material buffer.
     * @param primitiveState The primitive state.
     */
    constructor(framework: IFramework,
                projectionViewBuffer: IUniformBuffer,
                modelBuffer: IUniformBuffer,
                materialBuffer: IUniformBuffer,
                primitiveState?: IPrimitiveState,
    ) {
        super(framework, primitiveState);
        this._projectionViewBuffer = projectionViewBuffer as WebGlUniformBuffer;
        this._modelBuffer = modelBuffer as WebGlUniformBuffer;
        this._materialBuffer = materialBuffer as WebGlUniformBuffer;
    }


    /** @inheritdoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._projectionViewBuffer;
    }

    /** @inheritdoc */
    public set projectionViewBuffer(value: IUniformBuffer) {
        this._projectionViewBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritdoc */
    public get modelBuffer(): IUniformBuffer {
        return this._modelBuffer;
    }

    /** @inheritdoc */
    public set modelBuffer(value: IUniformBuffer) {
        this._modelBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritdoc */
    public get materialBuffer(): IUniformBuffer {
        return this._materialBuffer;
    }

    /** @inheritdoc */
    public set materialBuffer(value: IUniformBuffer) {
        this._materialBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritdoc */
    public get diffuseTexture(): ITexture2D  {
        return this._texture;
    }

    /** @inheritdoc */
    public set diffuseTexture(value: ITexture2D ) {
        this._texture = value as WebGlTexture2D;
    }

    /** @inheritdoc */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._sampler;
    }

    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._sampler = value as WebGlSampler | undefined;
    }

    /** @inheritdoc */
    public override initialize(): void {

        const module = this._framework.content.loadShaderModule("unlit_material") as WebGlShaderModule;
        this._program = module.program!;
        this._createResources();
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float4Float2Layout()];
        super.initialize();
    }

    private _createResources(): void {
        {
            this._texture = WebGlTexture2D.getOrCreateDefault(this._framework);

            this._cameraBlockIndex = this._gl.getUniformBlockIndex(this._program, "CameraBuffer");
            this._gl.uniformBlockBinding(this._program, this._cameraBlockIndex, WebGlUnlitRenderPipeline.CAMERA_BINDING_POINT);

            this._modelBlockIndex = this._gl.getUniformBlockIndex(this._program, "ModelBuffer");
            this._gl.uniformBlockBinding(this._program, this._modelBlockIndex, WebGlUnlitRenderPipeline.MODEL_BINDING_POINT);

            this._materialBlockIndex = this._gl.getUniformBlockIndex(this._program, "MaterialBuffer");
            this._gl.uniformBlockBinding(this._program, this._materialBlockIndex, WebGlUnlitRenderPipeline.MATERIAL_BINDING_POINT);
        }
    }


    /** @inheritdoc */
    protected _provideBuffers(): WebGLBuffer[] | undefined | null {
        if (this._lastVertexBuffer === null) {
            return null;
        }

        this._buffersArray[0] = this._lastVertexBuffer.buffer!;
        return this._buffersArray;
    }

    /** @inheritdoc */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount: number = -1, indicesOffset: number = 0): void {

        if (indicesCount == 0) {
            return;
        }

        const webGlVertexBuffer = vertexBuffer as WebGlVertexBuffer;
        const webGlIndexBuffer = indexBuffer as WebGLIndexBuffer;
        const webGlSampler = this._sampler ?? this._defaultTextureSampler;

        this.primitiveState.apply(this._gl);
        this._blendState.apply(this._gl);

        // if it was changed, we need to create a new vao.
        if (this._lastVertexBuffer != webGlVertexBuffer) {
            // Create a new VAO. Internally deletes the old one.
            this._lastVertexBuffer = webGlVertexBuffer;
            this._createVertexArrayObject();
        }

        this._gl.useProgram(this._program);
        // Bind the vao. It contains all the information about the vertex buffer layout ( vertices + instances)
        this._gl.bindVertexArray(this._vertexArrayObject);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, webGlIndexBuffer.buffer);
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
            WebGlUnlitRenderPipeline.CAMERA_BINDING_POINT,
            this._projectionViewBuffer.glBuffer!);
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
            WebGlUnlitRenderPipeline.MODEL_BINDING_POINT,
            this._modelBuffer.glBuffer!);
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
            WebGlUnlitRenderPipeline.MATERIAL_BINDING_POINT,
            this._materialBuffer.glBuffer!);
        this._gl.activeTexture(this._gl.TEXTURE0);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._texture!.glTexture);
        this._gl.bindSampler(0, webGlSampler.glSampler);

        // We can only really use two types uint16 and uint32. Boolean check to see which one to use.
        const type = indexBuffer.type == IndexBufferType.UINT_16
            ? this._gl.UNSIGNED_SHORT
            : this._gl.UNSIGNED_INT;

        // api.PolygonMode(GLEnum.FrontAndBack, GLEnum.Line);

        // Either draw all indices or a specific amount. If indicesCount is -1, draw all as defined by the index buffer.
        const toIndices = indicesCount > 0 ? indicesCount : indexBuffer.indicesCount;
        const fromIndices = indicesOffset * indexBuffer.elementByteSize;

        this._gl.drawElements(this.primitiveState.glPrimitiveType, toIndices, type, fromIndices);
    }

}