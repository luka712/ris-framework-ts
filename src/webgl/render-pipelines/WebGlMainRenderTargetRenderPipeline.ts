import {vec2} from "gl-matrix";
import type {WebGlVertexBuffer} from "../buffers/WebGlVertexBuffer.ts";
import {GeometryFormat} from "../../api/geometry/GeometryFormat.ts";
import type {WebGLIndexBuffer} from "../buffers/webgl-index-buffer";
import {VertexBufferLayout} from "../../core/rendering/vertex-buffer-layout";
import type {WebGlTexture2D} from "../texture/WebGlTexture2D.ts";
import type {WebGlUniformBuffer} from "../buffers/WebGlUniformBuffer.ts";
import WebGlShaderModule from "../shader/WebGlShaderModule.ts";
import {AWebGlRenderPipeline} from "./AWebGlRenderPipeline.ts";
import {
    BufferUsage,
    IndexBufferType,
    type IFramework,
    type IMainRenderTargetRenderPipeline,
    type ITexture2D,
    OutputColorSpace,
} from "../../api/index.ts";

/**
 * The WebGL implementation of the main render target render pipeline.
 * Encodes linear → sRGB in the blit shader when {@link outputColorSpace} is SRGB (the default framebuffer is never sRGB).
 */
export class WebGlMainRenderTargetRenderPipeline extends AWebGlRenderPipeline implements IMainRenderTargetRenderPipeline {

    private _vertexBuffer: WebGlVertexBuffer = null!;
    private _indexBuffer: WebGLIndexBuffer = null!;
    private _mainRenderTarget: WebGlTexture2D = null!;

    private static readonly FRAGMENT_DATA_BINDING_POINT = 0;

    /**
     * The `FragmentDataBuffer` (std140, 16 bytes), offsets in floats:
     * [0] u_flipY, [1] u_colorConversion, [2] u_gamma, [3] padding.
     */
    private readonly _fragmentData = new Float32Array(4);
    private _fragmentDataBuffer: WebGlUniformBuffer | null = null;
    private _fragmentDataBlockIndex = -1;
    private _outputColorSpace: OutputColorSpace = OutputColorSpace.NONE;

    /**
     * The constructor.
     * @param framework The framework.
     * @param mainRenderTarget The main render target texture. This is the texture that will be rendered to by this render pipeline. It should be the same texture as the one used in the swap chain's render pass descriptor for the main render target.
     */
    public constructor(framework: IFramework, mainRenderTarget: ITexture2D) {
        super(framework);
        this._mainRenderTarget = mainRenderTarget as WebGlTexture2D;

        // The default framebuffer's origin is bottom-left, so the render target is flipped by default.
        this._fragmentData[0] = 1;
        // Gamma default 2.2.
        this._fragmentData[2] = 2.2;
    }

    /**
     * Whether the render target is flipped vertically when drawn to the screen (the shader's `u_flipY`).
     * By default, true, since the WebGL default framebuffer's origin is bottom-left.
     */
    public get flipY(): boolean {
        return this._fragmentData[0] == 1;
    }

    public set flipY(value: boolean) {
        this._fragmentData[0] = value ? 1 : 0;
        this._fragmentDataBuffer?.update(this._fragmentData, 0, 1);
    }

    /**
     * The output color space. The default framebuffer is never sRGB, so this pipeline encodes in the shader.
     * - NONE: pass sampled values through.
     * - SRGB: encode with {@link gamma} (`pow(c, 1 / gamma)`).
     * Set by the renderer when `renderer.outputColorSpace` changes. By default, `OutputColorSpace.NONE`.
     */
    public get outputColorSpace(): OutputColorSpace {
        return this._outputColorSpace;
    }

    public set outputColorSpace(value: OutputColorSpace) {
        this._outputColorSpace = value;
        this._fragmentData[1] = value == OutputColorSpace.SRGB ? 1 : 0;
        this._fragmentDataBuffer?.update(this._fragmentData, 1, 1);
    }

    /**
     * The gamma used when {@link outputColorSpace} is SRGB. By default, 2.2.
     */
    public get gamma(): number {
        return this._fragmentData[2];
    }

    public set gamma(value: number) {
        this._fragmentData[2] = value;
        this._fragmentDataBuffer?.update(this._fragmentData, 2, 1);
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_TEXTURECOORDS2;

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
        const shaderModule = this._framework.content.loadShaderModule("main_render_target") as WebGlShaderModule;
        this._program = shaderModule.program!;
        this._createResources();
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float2Layout()];
        super.initialize();

        this._fragmentDataBuffer = this._framework.bufferFactory.createUniformBuffer(
            this._fragmentData,
            BufferUsage.UNIFORM | BufferUsage.COPY_DST,
            "Main Render Target Fragment Data Buffer") as WebGlUniformBuffer;
        this._fragmentDataBlockIndex = this._gl.getUniformBlockIndex(this._program, "FragmentDataBuffer");
        if (this._fragmentDataBlockIndex !== this._gl.INVALID_INDEX) {
            this._gl.uniformBlockBinding(this._program, this._fragmentDataBlockIndex, WebGlMainRenderTargetRenderPipeline.FRAGMENT_DATA_BINDING_POINT);
        } else {
            console.warn("WebGlMainRenderTargetRenderPipeline: uniform block 'FragmentDataBuffer' not found in the main_render_target shader.");
        }
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
            "Main Render Target Render Pipeline Vertex Buffer"
        ) as WebGlVertexBuffer;

        this._indexBuffer = this._framework.bufferFactory.createIndexBuffer(
            geometry.indices!, "Main Render Target Render Pipeline Index Buffer",
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

        this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, WebGlMainRenderTargetRenderPipeline.FRAGMENT_DATA_BINDING_POINT, this._fragmentDataBuffer!.glBuffer!);

        const indexType = this._indexBuffer.type == IndexBufferType.UINT_16 ? this._gl.UNSIGNED_SHORT : this._gl.UNSIGNED_INT;
        this._gl.drawElements(this._gl.TRIANGLES, this._indexBuffer.indicesCount, indexType, 0);
    }

    /** @inheritdoc */
    public override dispose(): void {
        // ARenderer recreates this pipeline on every resize, so release the quad buffers too.
        this._vertexBuffer?.dispose();
        this._indexBuffer?.dispose();
        this._fragmentDataBuffer?.dispose();
        this._fragmentDataBuffer = null;
        super.dispose();
    }
}
