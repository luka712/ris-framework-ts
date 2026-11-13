import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The options for {@link WebGpuRenderPipelineUtilities.create}. */
export interface WebGpuRenderPipelineOptions {
    /** The label. */
    label?: string;
    /** The shader module holding both stages. */
    module: GPUShaderModule;
    /** The pipeline layout. */
    layout: GPUPipelineLayout;
    /** The vertex buffer layouts. */
    vertexBufferLayouts: GPUVertexBufferLayout[];
    /** The color target format. */
    colorFormat: GPUTextureFormat;
    /** The blend state, if any. */
    blend?: GPUBlendState;
    /** The primitive state. */
    primitive: GPUPrimitiveState;
    /** The depth/stencil format, or undefined when the pass has no depth attachment. */
    depthStencilFormat?: GPUTextureFormat;
    /** The vertex entry point. By default, `main_vs`. */
    vertexEntryPoint?: string;
    /** The fragment entry point. By default, `main_fs`. */
    fragmentEntryPoint?: string;
}

/** The WebGPU render pipeline utilities. */
export class WebGpuRenderPipelineUtilities extends AWebGpuLoggingUtilities {

    /**
     * Creates a render pipeline. Depth testing uses `less-equal` with depth writes, like the WebGL backend.
     * @param device The device.
     * @param options The options.
     * @returns The render pipeline.
     */
    public create(device: GPUDevice, options: WebGpuRenderPipelineOptions): GPURenderPipeline {
        return this.withValidation(device, "RenderPipeline", options.label, () => device.createRenderPipeline({
            label: options.label,
            layout: options.layout,
            vertex: {
                module: options.module,
                entryPoint: options.vertexEntryPoint ?? "main_vs",
                buffers: options.vertexBufferLayouts,
            },
            fragment: {
                module: options.module,
                entryPoint: options.fragmentEntryPoint ?? "main_fs",
                targets: [{format: options.colorFormat, blend: options.blend}],
            },
            primitive: options.primitive,
            depthStencil: options.depthStencilFormat !== undefined ? {
                format: options.depthStencilFormat,
                depthWriteEnabled: true,
                depthCompare: "less-equal",
            } : undefined,
        }));
    }
}
