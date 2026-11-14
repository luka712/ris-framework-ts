import {
    GeometryFormat,
    type IFramework,
    type IPrimitiveState,
    type ISampler,
    type IUniformBuffer,
    type IUnlitTextureArrayRenderPipeline,
    type IVertexBuffer,
    type IIndexBuffer,
    IndexBufferType,
} from "../../../api/index.ts";
import type {ITexture2DArray} from "../../../api/rendering/texture/ITexture2DArray.ts";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout";
import type {WebGlUniformBuffer} from "../../buffers/WebGlUniformBuffer.ts";
import {asWebGLUniformBuffer} from "../../cast/cast";
import WebGlShaderModule from "../../shader/WebGlShaderModule.ts";
import {WebGlVertexBuffer} from "../../buffers/WebGlVertexBuffer.ts";
import {AWebGlRenderPipeline} from "../AWebGlRenderPipeline.ts";
import type {WebGLIndexBuffer} from "../../buffers/webgl-index-buffer";
import type {WebGlSampler} from "../../sampler/webgl-sampler.ts";
import {WebGlTexture2DArray} from "../../texture/WebGlTexture2DArray.ts";
import {WebGlTextureFactory} from "../../texture/WebGlTextureFactory.ts";

/**
 * The WebGL implementation of {@link IUnlitTextureArrayRenderPipeline}.
 * Uses the `unlit_texture_array_material` GLSL program: the unlit vertex shader and a `sampler2DArray` fragment shader.
 * Uniform blocks: `CameraBuffer` (0), `ModelBuffer` (1), `MaterialBuffer` (2). The texture array is bound to unit 0.
 */
export class WebGlUnlitTextureArrayRenderPipeline extends AWebGlRenderPipeline implements IUnlitTextureArrayRenderPipeline {

    private static readonly CAMERA_BINDING_POINT = 0;
    private static readonly MODEL_BINDING_POINT = 1;
    private static readonly MATERIAL_BINDING_POINT = 2;

    private _texture: WebGlTexture2DArray = null!;
    private _sampler?: WebGlSampler;
    private _projectionViewBuffer: WebGlUniformBuffer;
    private _modelBuffer: WebGlUniformBuffer;
    private _materialBuffer: WebGlUniformBuffer;
    private _buffersArray: WebGLBuffer[] = [null!];
    private _lastVertexBuffer: WebGlVertexBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection view buffer (std140 `mat4`).
     * @param modelBuffer The model buffer (std140 `mat4`). Required.
     * @param materialBuffer The material buffer. See {@link materialBuffer}.
     * @param primitiveState The primitive state. By default, the graphics device's default primitive state.
     * @throws Error when `modelBuffer` is missing.
     */
    constructor(framework: IFramework,
                projectionViewBuffer: IUniformBuffer,
                modelBuffer: IUniformBuffer,
                materialBuffer: IUniformBuffer,
                primitiveState?: IPrimitiveState,
    ) {
        // Validated before super(), which touches WebGL.
        if (!modelBuffer) {
            throw new Error("WebGlUnlitTextureArrayRenderPipeline: modelBuffer is required (the mesh's model buffer, std140 mat4).");
        }
        super(framework, primitiveState);
        this._projectionViewBuffer = projectionViewBuffer as WebGlUniformBuffer;
        this._modelBuffer = modelBuffer as WebGlUniformBuffer;
        this._materialBuffer = materialBuffer as WebGlUniformBuffer;
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2;

    /** @inheritDoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._projectionViewBuffer;
    }

    /** @inheritDoc */
    public set projectionViewBuffer(value: IUniformBuffer) {
        this._projectionViewBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritDoc */
    public get modelBuffer(): IUniformBuffer {
        return this._modelBuffer;
    }

    /** @inheritDoc */
    public set modelBuffer(value: IUniformBuffer) {
        if (!value) {
            throw new Error("WebGlUnlitTextureArrayRenderPipeline: modelBuffer is required (the mesh's model buffer, std140 mat4).");
        }
        this._modelBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritDoc */
    public get materialBuffer(): IUniformBuffer {
        return this._materialBuffer;
    }

    /** @inheritDoc */
    public set materialBuffer(value: IUniformBuffer) {
        this._materialBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritDoc */
    public get diffuseTexture(): ITexture2DArray {
        return this._texture;
    }

    /** @inheritDoc */
    public set diffuseTexture(value: ITexture2DArray) {
        this._texture = value as WebGlTexture2DArray;
    }

    /** @inheritDoc */
    public get diffuseTextureSampler(): ISampler | undefined {
        return this._sampler;
    }

    /** @inheritDoc */
    public set diffuseTextureSampler(value: ISampler | undefined) {
        this._sampler = value as WebGlSampler | undefined;
    }

    /** Loads the `unlit_texture_array_material` program, binds its uniform blocks and sets the default texture array. */
    public override initialize(): void {
        const module = this._framework.content.loadShaderModule("unlit_texture_array_material") as WebGlShaderModule;
        this._program = module.program!;
        this._texture = (this._framework.textureFactory as WebGlTextureFactory).getOrCreateDefaultTexture2DArray();

        const gl = this._gl;
        gl.uniformBlockBinding(this._program, gl.getUniformBlockIndex(this._program, "CameraBuffer"),
            WebGlUnlitTextureArrayRenderPipeline.CAMERA_BINDING_POINT);
        gl.uniformBlockBinding(this._program, gl.getUniformBlockIndex(this._program, "ModelBuffer"),
            WebGlUnlitTextureArrayRenderPipeline.MODEL_BINDING_POINT);
        gl.uniformBlockBinding(this._program, gl.getUniformBlockIndex(this._program, "MaterialBuffer"),
            WebGlUnlitTextureArrayRenderPipeline.MATERIAL_BINDING_POINT);

        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float4Float2Layout()];
        super.initialize();
    }

    /** @inheritDoc */
    protected _provideBuffers(): WebGLBuffer[] | undefined | null {
        if (this._lastVertexBuffer === null) {
            return null;
        }
        this._buffersArray[0] = this._lastVertexBuffer.buffer!;
        return this._buffersArray;
    }

    /**
     * Draws indexed geometry with the texture array bound to unit 0.
     * @param vertexBuffer The vertex buffer, in {@link geometryFormat}.
     * @param indexBuffer The index buffer.
     * @param indicesCount The number of indices to draw. By default, -1 (all indices of the index buffer).
     * @param indicesOffset The first index to draw. By default, 0.
     */
    public render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount: number = -1, indicesOffset: number = 0): void {
        if (indicesCount == 0) {
            return;
        }

        const gl = this._gl;
        const webGlVertexBuffer = vertexBuffer as WebGlVertexBuffer;
        const webGlIndexBuffer = indexBuffer as WebGLIndexBuffer;
        const webGlSampler = this._sampler ?? this._defaultTextureSampler;

        this.primitiveState.apply(gl);
        this._blendState.apply(gl);

        // A new vertex buffer needs a new VAO. Creating one deletes the old one.
        if (this._lastVertexBuffer != webGlVertexBuffer) {
            this._lastVertexBuffer = webGlVertexBuffer;
            this._createVertexArrayObject();
        }

        gl.useProgram(this._program);
        gl.bindVertexArray(this._vertexArrayObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webGlIndexBuffer.buffer);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, WebGlUnlitTextureArrayRenderPipeline.CAMERA_BINDING_POINT, this._projectionViewBuffer.glBuffer!);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, WebGlUnlitTextureArrayRenderPipeline.MODEL_BINDING_POINT, this._modelBuffer.glBuffer!);
        gl.bindBufferBase(gl.UNIFORM_BUFFER, WebGlUnlitTextureArrayRenderPipeline.MATERIAL_BINDING_POINT, this._materialBuffer.glBuffer!);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this._texture.glTexture);
        gl.bindSampler(0, webGlSampler.glSampler);

        const type = indexBuffer.type == IndexBufferType.UINT_16 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
        // -1 draws every index of the index buffer.
        const toIndices = indicesCount > 0 ? indicesCount : indexBuffer.indicesCount;
        const fromIndices = indicesOffset * indexBuffer.elementByteSize;

        gl.drawElements(this.primitiveState.glPrimitiveType, toIndices, type, fromIndices);
    }
}
