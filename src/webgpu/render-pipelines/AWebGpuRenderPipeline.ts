import {
    GeometryFormat,
    type IBlendState,
    type IFramework,
    type IIndexBuffer,
    type IPrimitiveState,
    type IRenderPipeline,
    type IVertexBuffer,
    TextureFormat,
} from "../../api/index.ts";
import type {VertexBufferLayout} from "../../core/rendering/vertex-buffer-layout.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import type {WebGpuBlendState} from "../blending/WebGpuBlendState.ts";
import type {WebGpuPrimitiveState} from "../primitive/WebGpuPrimitiveState.ts";
import type {WebGpuSampler} from "../sampler/WebGpuSampler.ts";
import type {
    GpuBindGroupLayout,
    GpuPipelineLayout,
    GpuRenderPipeline,
    GpuShaderModule,
} from "../WebGpuTypes.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";

/**
 * The base WebGPU render pipeline. Holds the device, the states and the vertex layouts,
 * and builds the `GPURenderPipeline` from them.
 * @internal
 */
export abstract class AWebGpuRenderPipeline implements IRenderPipeline {

    protected readonly _framework: IFramework;
    protected readonly _graphicsDevice: WebGpuGraphicsDevice;
    protected readonly _defaultTextureSampler: WebGpuSampler;
    protected _blendState: WebGpuBlendState;
    protected _gpuPipeline: GpuRenderPipeline | null = null;
    protected _pipelineLayout: GpuPipelineLayout | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param primitiveState The optional primitive state; defaults to the device's.
     */
    protected constructor(framework: IFramework, primitiveState?: IPrimitiveState) {
        this._framework = framework;
        this._graphicsDevice = framework.renderer.graphicsDevice as WebGpuGraphicsDevice;
        this._blendState = this._graphicsDevice.defaultBlendState as WebGpuBlendState;
        this._defaultTextureSampler = this._graphicsDevice.defaultTextureSampler as WebGpuSampler;
        this.primitiveState = (primitiveState ?? this._graphicsDevice.defaultPrimitiveState) as WebGpuPrimitiveState;
    }

    /** @inheritDoc */
    public abstract readonly geometryFormat: GeometryFormat;

    /** @inheritDoc */
    public get blendState(): IBlendState {
        return this._blendState;
    }

    /** @inheritDoc */
    public readonly primitiveState: WebGpuPrimitiveState;

    /** @inheritDoc */
    public vertexBufferLayouts: VertexBufferLayout[] = null!;

    /** @inheritDoc */
    public abstract initialize(): void;

    /** @inheritDoc */
    public abstract render(vertexBuffer: IVertexBuffer, indexBuffer: IIndexBuffer, indicesCount?: number, indicesOffset?: number): void;

    /**
     * Creates the pipeline layout and the render pipeline.
     * @param label The label.
     * @param module The WGSL module with `main_vs` and `main_fs`.
     * @param bindGroupLayouts The bind group layouts, in group order.
     * @param colorFormat The color target format.
     * @param depthStencilFormat The depth format, or undefined when the pass has no depth attachment.
     */
    protected _createGpuPipeline(
        label: string,
        module: GpuShaderModule,
        bindGroupLayouts: GpuBindGroupLayout[],
        colorFormat: TextureFormat,
        depthStencilFormat?: TextureFormat): void {

        if (!this.vertexBufferLayouts || this.vertexBufferLayouts.length === 0) {
            throw new Error("At least one vertex buffer layout must be provided for the render pipeline.");
        }
        const device = this._graphicsDevice.device;
        this._pipelineLayout = device.createPipelineLayout({label: `${label} layout`, bindGroupLayouts});
        this._gpuPipeline = device.createRenderPipeline({
            label,
            layout: this._pipelineLayout,
            vertex: {
                module,
                entryPoint: "main_vs",
                buffers: this.vertexBufferLayouts.map(l => WebGpuConverter.convertVertexBufferLayout(l)),
            },
            fragment: {
                module,
                entryPoint: "main_fs",
                targets: [{
                    format: WebGpuConverter.convertTextureFormat(colorFormat),
                    blend: this._blendState.gpuBlendState,
                }],
            },
            primitive: this.primitiveState.gpuPrimitiveState,
            depthStencil: depthStencilFormat !== undefined ? {
                format: WebGpuConverter.convertTextureFormat(depthStencilFormat),
                depthWriteEnabled: true,
                // Matches the WebGL backend's LEQUAL.
                depthCompare: "less-equal",
            } : undefined,
        });
    }

    /** @inheritDoc */
    public dispose(): void {
        // Pipelines and layouts have no destroy() in WebGPU.
        this._gpuPipeline = null;
        this._pipelineLayout = null;
    }
}
