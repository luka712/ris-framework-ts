import {
    GeometryFormat,
    type IFramework, type IPrimitiveState,
    type ISampler,
    type ITexture2D,
    type IUniformBuffer,
    type IVertexBuffer
} from "../../../api";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout";
import type {WebGlUniformBuffer} from "../../buffers/WebGlUniformBuffer.ts";
import {asWebGLUniformBuffer} from "../../cast/cast";
import WebGlShaderModule from "../../shader/WebGlShaderModule.ts";
import {WebGlTexture2D} from "../../texture/WebGlTexture2D.ts";
import {WebGlVertexBuffer} from '../../buffers/WebGlVertexBuffer.ts';
import {AWebGlRenderPipeline} from "../AWebGlRenderPipeline.ts";
import type {WebGLIndexBuffer} from "../../buffers/webgl-index-buffer";
import {
    type IIndexBuffer,
    IndexBufferType,
    DEFAULT_DIRECTIONAL_LIGHTS_COUNT,
    DEFAULT_POINT_LIGHTS_COUNT
} from "../../../api";
import type {WebGlSampler} from "../../sampler/webgl-sampler.ts";
import type {
    IForwardBlinnPhongRenderPipeline
} from "../../../api/rendering/render-pipelines/IForwardBlinnPhongRenderPipeline.ts";

/**
 * The WebGL implementation of Blinn-Phong with forward calculated lighting.
 * @internal
 **/
export class WebGlForwardBlinnPhongRenderPipeline extends AWebGlRenderPipeline implements IForwardBlinnPhongRenderPipeline {

    private static readonly CAMERA_BINDING_POINT = 0;
    private static readonly MODEL_BINDING_POINT = 1;
    private static readonly MATERIAL_BINDING_POINT = 2;
    private static readonly LIGHTS_BINDING_POINT = 3;
    private static readonly CAMERA_POSITION_BINDING_POINT = 4;

    private _texture: WebGlTexture2D = null!;
    private _sampler?: WebGlSampler;
    private _projectionViewBuffer: WebGlUniformBuffer;
    private _modelBuffer: WebGlUniformBuffer;
    private _materialBuffer: WebGlUniformBuffer;
    private _lightsBuffer: WebGlUniformBuffer;
    private _cameraBlockIndex = -1;
    private _modelBlockIndex = -1;
    private _materialBlockIndex = -1;
    private _lightsBlockIndex = -1;
    private _cameraPositionBuffer: WebGlUniformBuffer;
    private _cameraPositionBlockIndex = -1;
    private _maxDirectionalLights = DEFAULT_DIRECTIONAL_LIGHTS_COUNT;
    private _maxPointLights = DEFAULT_POINT_LIGHTS_COUNT;
    private _initialized = false;
    private _buffersArray: WebGLBuffer[] = [null!];
    private _lastVertexBuffer: WebGlVertexBuffer | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection view buffer.
     * @param modelBuffer The model buffer.
     * @param materialBuffer The material buffer.
     * @param lightsBuffer The lights buffer (`LightsBuffer.buffer`). May be set later.
     * @param cameraPositionBuffer The camera position buffer (world-space eye).
     * @param primitiveState The primitive state.
     */
    public constructor(framework: IFramework,
                       projectionViewBuffer: IUniformBuffer,
                       modelBuffer: IUniformBuffer,
                       materialBuffer: IUniformBuffer,
                       lightsBuffer: IUniformBuffer | undefined,
                       cameraPositionBuffer: IUniformBuffer,
                       primitiveState?: IPrimitiveState,
    ) {
        // Validated before super(), which touches WebGL.
        if (!modelBuffer) {
            throw new Error("WebGlForwardBlinnPhongRenderPipeline: modelBuffer is required (the mesh's model buffer, std140 mat4).");
        }
        super(framework, primitiveState);
        this._projectionViewBuffer = projectionViewBuffer as WebGlUniformBuffer;
        this._modelBuffer = modelBuffer as WebGlUniformBuffer;
        this._materialBuffer = materialBuffer as WebGlUniformBuffer;
        this._lightsBuffer = lightsBuffer as WebGlUniformBuffer;
        this._cameraPositionBuffer = cameraPositionBuffer as WebGlUniformBuffer;
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3;

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
        if (!value) {
            throw new Error("WebGlForwardBlinnPhongRenderPipeline: modelBuffer is required (the mesh's model buffer, std140 mat4).");
        }
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
    public get lightsBuffer(): IUniformBuffer {
        return this._lightsBuffer;
    }

    /** @inheritdoc */
    public set lightsBuffer(value: IUniformBuffer) {
        this._lightsBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritdoc */
    public get maxDirectionalLights(): number {
        return this._maxDirectionalLights;
    }

    /** @inheritdoc */
    public get maxPointLights(): number {
        return this._maxPointLights;
    }

    /** @inheritdoc */
    public setLightCounts(maxDirectionalLights: number, maxPointLights: number): void {
        if (maxDirectionalLights === this._maxDirectionalLights && maxPointLights === this._maxPointLights) {
            return;
        }
        this._maxDirectionalLights = maxDirectionalLights;
        this._maxPointLights = maxPointLights;
        if (this._initialized) {
            // The vertex array object only depends on the vertex layout, so only the program and block bindings change.
            this._loadProgram();
        }
    }

    /** @inheritdoc */
    public get cameraPositionBuffer(): IUniformBuffer {
        return this._cameraPositionBuffer;
    }

    /** @inheritdoc */
    public set cameraPositionBuffer(value: IUniformBuffer) {
        this._cameraPositionBuffer = asWebGLUniformBuffer(value);
    }

    /** @inheritdoc */
    public get diffuseTexture(): ITexture2D {
        return this._texture;
    }

    /** @inheritdoc */
    public set diffuseTexture(value: ITexture2D) {
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

        this._loadProgram();
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float4Float2Float3Layout()];
        super.initialize();
        this._initialized = true;
    }

    /** Loads the shader variant for the current light counts (cached per counts by the shader loader). */
    private _loadProgram(): void {
        const module = this._framework.content.loadShaderModule("forward_blinn_phong_material", {
            "DIRECTIONAL_LIGHTS_COUNT": this._maxDirectionalLights,
            "POINT_LIGHTS_COUNT": this._maxPointLights,
        }) as WebGlShaderModule;
        this._program = module.program!;
        this._createResources();
    }

    private _createResources(): void {
        {
            this._texture = WebGlTexture2D.getOrCreateDefault(this._framework);

            this._cameraBlockIndex = this._gl.getUniformBlockIndex(this._program, "CameraBuffer");
            this._gl.uniformBlockBinding(this._program, this._cameraBlockIndex, WebGlForwardBlinnPhongRenderPipeline.CAMERA_BINDING_POINT);

            this._modelBlockIndex = this._gl.getUniformBlockIndex(this._program, "ModelBuffer");
            this._gl.uniformBlockBinding(this._program, this._modelBlockIndex, WebGlForwardBlinnPhongRenderPipeline.MODEL_BINDING_POINT);

            this._materialBlockIndex = this._gl.getUniformBlockIndex(this._program, "MaterialBuffer");
            this._gl.uniformBlockBinding(this._program, this._materialBlockIndex, WebGlForwardBlinnPhongRenderPipeline.MATERIAL_BINDING_POINT);

            this._lightsBlockIndex = this._gl.getUniformBlockIndex(this._program, "LightsBuffer");
            this._gl.uniformBlockBinding(this._program, this._lightsBlockIndex, WebGlForwardBlinnPhongRenderPipeline.LIGHTS_BINDING_POINT);

            this._cameraPositionBlockIndex = this._gl.getUniformBlockIndex(this._program, "CameraPositionBuffer");
            this._gl.uniformBlockBinding(this._program, this._cameraPositionBlockIndex, WebGlForwardBlinnPhongRenderPipeline.CAMERA_POSITION_BINDING_POINT);
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
            WebGlForwardBlinnPhongRenderPipeline.CAMERA_BINDING_POINT,
            this._projectionViewBuffer.glBuffer!);
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
            WebGlForwardBlinnPhongRenderPipeline.MODEL_BINDING_POINT,
            this._modelBuffer.glBuffer!);

        if (this.materialBuffer) {
            this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
                WebGlForwardBlinnPhongRenderPipeline.MATERIAL_BINDING_POINT,
                this._materialBuffer.glBuffer!);
        }
        if (this._lightsBuffer) {
            this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
                WebGlForwardBlinnPhongRenderPipeline.LIGHTS_BINDING_POINT,
                this._lightsBuffer.glBuffer!);
        }
        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,
            WebGlForwardBlinnPhongRenderPipeline.CAMERA_POSITION_BINDING_POINT,
            this._cameraPositionBuffer.glBuffer!);
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