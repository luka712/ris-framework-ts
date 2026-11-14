import {TextureFormat} from "../../api/index.ts";
import {WgslShaderModuleContent} from "../../api/content/ShaderModuleContent.ts";
import {WebGpuConverter} from "./WebGpuConverter.ts";
import {AWebGpuLoggingUtilities} from "./WebGpuLogger.ts";

/** The objects shared by every mipmap generation on one device. */
interface MipmapDeviceState {
    module: GPUShaderModule;
    sampler: GPUSampler;
    bindGroupLayout: GPUBindGroupLayout;
    pipelineLayout: GPUPipelineLayout;
    /** One render pipeline per target format. */
    pipelines: Map<GPUTextureFormat, GPURenderPipeline>;
}

/**
 * Generates mipmaps on the GPU with a render pass per mip level and array layer: each level is drawn from the previous one
 * with a linear filter (the `generate_mipmaps` WGSL program). WebGPU has no built-in mipmap generation.
 * The shader module, sampler and pipelines are created once per device and format.
 */
export class WebGpuMipmapUtilities extends AWebGpuLoggingUtilities {

    /** The formats mipmaps can be generated for: color-renderable and filterable without optional features. */
    public static readonly SUPPORTED_FORMATS: ReadonlyArray<TextureFormat> = [TextureFormat.RGBA8_UNORM, TextureFormat.RGBA8_UNORM_SRGB];

    private readonly _deviceStates = new WeakMap<GPUDevice, MipmapDeviceState>();

    /**
     * Generates mip levels `1 .. mipLevelCount - 1` of every layer of a 2D (array) texture from its mip level 0.
     * Each level is rendered from the previous one through `2d` views of a single layer and level, then submitted to the device queue.
     * @param device The device.
     * @param texture The texture. It must have `TEXTURE_BINDING` and `RENDER_ATTACHMENT` usage and `mipLevelCount` levels.
     * @param format The texture format. Must be one of {@link SUPPORTED_FORMATS}.
     * @param layers The number of array layers. 1 for a 2D texture.
     * @param mipLevelCount The mip level count of the texture. With 1 level nothing is rendered.
     * @param label The label, used in error messages and GPU object labels. By default, none.
     * @throws Error when the format is not one of {@link SUPPORTED_FORMATS}.
     */
    public generate2DArray(device: GPUDevice, texture: GPUTexture, format: TextureFormat,
                           layers: number, mipLevelCount: number, label?: string): void {
        if (!WebGpuMipmapUtilities.SUPPORTED_FORMATS.includes(format)) {
            throw new Error(`WebGpuMipmapUtilities.generate2DArray: '${label ?? "unlabeled"}' has format ${format}; ` +
                `mipmaps can only be generated for ${WebGpuMipmapUtilities.SUPPORTED_FORMATS.join(" and ")}.`);
        }
        if (mipLevelCount <= 1) {
            return;
        }

        const gpuFormat = WebGpuConverter.convertTextureFormat(format);
        const state = this._getDeviceState(device);
        const pipeline = this._getPipeline(device, state, gpuFormat);
        const encoder = device.createCommandEncoder({label: `${label ?? ""} generate mipmaps`});

        for (let layer = 0; layer < layers; layer++) {
            let source = texture.createView({dimension: "2d", baseMipLevel: 0, mipLevelCount: 1, baseArrayLayer: layer, arrayLayerCount: 1});
            for (let level = 1; level < mipLevelCount; level++) {
                const target = texture.createView({dimension: "2d", baseMipLevel: level, mipLevelCount: 1, baseArrayLayer: layer, arrayLayerCount: 1});
                const bindGroup = device.createBindGroup({
                    label: `${label ?? ""} mipmap layer ${layer} level ${level}`,
                    layout: state.bindGroupLayout,
                    entries: [
                        {binding: 0, resource: source},
                        {binding: 1, resource: state.sampler},
                    ],
                });
                const pass = encoder.beginRenderPass({
                    label: `${label ?? ""} mipmap layer ${layer} level ${level}`,
                    colorAttachments: [{view: target, loadOp: "clear", storeOp: "store", clearValue: {r: 0, g: 0, b: 0, a: 0}}],
                });
                pass.setPipeline(pipeline);
                pass.setBindGroup(0, bindGroup);
                pass.draw(3);
                pass.end();
                source = target;
            }
        }

        device.queue.submit([encoder.finish()]);
    }

    /** Returns the shader module, sampler and layouts of a device, creating them on first use. */
    private _getDeviceState(device: GPUDevice): MipmapDeviceState {
        let state = this._deviceStates.get(device);
        if (!state) {
            const code = WgslShaderModuleContent.generate_mipmaps?.shader;
            if (!code) {
                throw new Error("WebGpuMipmapUtilities: the generate_mipmaps WGSL program is missing from WgslShaderModuleContent.");
            }
            const module = this.withValidation(device, "ShaderModule", "generate_mipmaps", () =>
                device.createShaderModule({label: "generate_mipmaps", code}));
            const sampler = device.createSampler({label: "generate_mipmaps sampler", minFilter: "linear", magFilter: "linear"});
            const bindGroupLayout = device.createBindGroupLayout({
                label: "generate_mipmaps group 0 layout",
                entries: [
                    {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: "float", viewDimension: "2d"}},
                    {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: "filtering"}},
                ],
            });
            const pipelineLayout = device.createPipelineLayout({label: "generate_mipmaps layout", bindGroupLayouts: [bindGroupLayout]});
            state = {module, sampler, bindGroupLayout, pipelineLayout, pipelines: new Map()};
            this._deviceStates.set(device, state);
        }
        return state;
    }

    /** Returns the render pipeline for a target format, creating it on first use. */
    private _getPipeline(device: GPUDevice, state: MipmapDeviceState, format: GPUTextureFormat): GPURenderPipeline {
        let pipeline = state.pipelines.get(format);
        if (!pipeline) {
            pipeline = this.withValidation(device, "RenderPipeline", `generate_mipmaps ${format}`, () => device.createRenderPipeline({
                label: `generate_mipmaps ${format}`,
                layout: state.pipelineLayout,
                vertex: {module: state.module, entryPoint: "main_vs"},
                fragment: {module: state.module, entryPoint: "main_fs", targets: [{format}]},
                primitive: {topology: "triangle-list"},
            }));
            state.pipelines.set(format, pipeline);
        }
        return pipeline;
    }
}
