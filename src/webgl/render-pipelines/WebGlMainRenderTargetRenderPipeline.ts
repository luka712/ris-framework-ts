import {vec2} from "gl-matrix";
import type {WebGlVertexBuffer} from "../buffers/WebGlVertexBuffer.ts";
import {GeometryFormat} from "../../geometry/GeometryFormat.ts";
import type {WebGLIndexBuffer} from "../buffers/webgl-index-buffer";
import {VertexBufferLayout} from "../../core/rendering/vertex-buffer-layout";
import type {WebGlTexture2D} from "../texture/WebGlTexture2D.ts";
import WebGlShaderModule from "../shader/WebGlShaderModule.ts";
import {AWebGlRenderPipeline} from "./AWebGlRenderPipeline.ts";
import {BufferUsage, type IFramework, type IMainRenderTargetRenderPipeline, type ITexture2D} from "ris-framework-api";

/**
 * The WebGL implementation of the main render target render pipeline.
 */
export class WebGlMainRenderTargetRenderPipeline extends AWebGlRenderPipeline implements IMainRenderTargetRenderPipeline {

    private _vertexBuffer: WebGlVertexBuffer = null!;
    private _indexBuffer: WebGLIndexBuffer = null!;
    private _mainRenderTarget: WebGlTexture2D = null!;

    /**
     * The constructor.
     * @param framework The framework.
     * @param mainRenderTarget The main render target texture. This is the texture that will be rendered to by this render pipeline. It should be the same texture as the one used in the swap chain's render pass descriptor for the main render target.
     */
    public constructor(framework: IFramework, mainRenderTarget: ITexture2D) {
        super(framework);
        this._mainRenderTarget = mainRenderTarget as WebGlTexture2D;
    }

    /** @inheritdoc */
    protected _provideBuffers(): WebGLBuffer[] {
        return [this._vertexBuffer.buffer!];
    }

    /** @inheritdoc */
    public get mainRenderTarget(): ITexture2D {
        if (!this._mainRenderTarget) {
            throw new Error("Render target is not set.");
        }
        return this._mainRenderTarget;
    }

    /** @inheritdoc */
    public set mainRenderTarget(value: ITexture2D) {
        this._mainRenderTarget = value as WebGlTexture2D;
    }

    /** @inheritdoc */
    public initialize(): void {
        const shaderModule = this._framework.content.loadShaderModule("main_render_target_flip_y") as WebGlShaderModule;
        this._program = shaderModule.program!;
        this._createResources();
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float2Layout()];
        super.initialize();
    }

    private _createResources(): void {

        // By default, quad is from [-0.5, 0.5] space. We want to move it to
        // [-1, 1] space to cover the whole screen.
        const geometry = this._framework.geometryBuilder.quadGeometry(vec2.fromValues(2, 2));
        const data = geometry.toInterleaved(GeometryFormat.POS3_TEXTURECOORDS2);

        this._vertexBuffer = this._framework.bufferFactory.createVertexBuffer(
            data,
            (3 + 2) * Float32Array.BYTES_PER_ELEMENT,
            BufferUsage.VERTEX,
            "Main Frame Buffer Render Pipeline Vertex Buffer"
        ) as WebGlVertexBuffer;

        this._indexBuffer = this._framework.bufferFactory.createIndexBuffer(
            geometry.indices!, "Main Frame Buffer Render Pipeline Index Buffer",
        ) as WebGLIndexBuffer;
    }

    /** @inheritdoc */
    public render(): void {

        if (this._program == null) {
            return;
        }

        this._setupPipeline();

        this._gl.useProgram(this._program);
        this._gl.bindVertexArray(this._vertexArrayObject);
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer.buffer);

        this._gl.activeTexture(this._gl.TEXTURE0);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._mainRenderTarget.glTexture);
        this._gl.bindSampler(0, this._defaultTextureSampler.glSampler);

        this._gl.drawElements(this._gl.TRIANGLES, this._indexBuffer.indicesCount, this._gl.UNSIGNED_SHORT, 0);
    }
}
