import {BlendStateDescriptor} from "./blending/blend-state-descriptor";
import {TextureSamplerFilteringPreset} from "./enums";
import type {PrimitiveStateDescriptor} from "./primitive/PrimitiveStateDescriptor.ts";
import type {IRenderPass} from "./render-pass/render-pass-interface";
import {SamplerDescriptor} from "./sampler/sampler-descriptor";
import {
    type IGPUInfo,
    type IGraphicsDeviceFeatures,
    type ISampler,
    type IBlendState,
    type IPrimitiveState,
    type IGraphicsDevice, SwapChainDescriptor, type RenderPassDescriptor, SamplerFilter, MipMapSamplerFilter,
    type ISwapChain
} from "ris-framework-api";

/**
 * The descriptor for the graphics device. This is used to configure the graphics device during initialization.
 */
export class GraphicsDeviceDescriptor {

    /**
     * Defines the preset for texture sampler filtering.
     * This is used to configure the default texture sampler in the graphics device.
     *  The default texture sampler is used when a texture is sampled without a specific sampler being bound.
     */
    public samplerFilteringPreset = TextureSamplerFilteringPreset.BILINEAR;
}

/**
 * The abstract base class for graphics devices.
 */
export abstract class AGraphicsDevice implements IGraphicsDevice {

    protected readonly _descriptor: GraphicsDeviceDescriptor;
    protected _defaultTextureSampler: ISampler = null!;
    protected _defaultBlendState: IBlendState = null!;
    protected _defaultPrimitiveState: IPrimitiveState = null!;

    /**
     * The constructor.
     * @param descriptor The descriptor for the graphics device. This is used to configure the graphics device during initialization.
     */
    protected constructor(descriptor: GraphicsDeviceDescriptor) {
        this._descriptor = descriptor;
    }

    /** @inheritdoc */
    abstract readonly features : IGraphicsDeviceFeatures;

    /** @inheritdoc */
    abstract readonly gpuInfo: IGPUInfo;

    /** @inheritdoc */
    public get defaultTextureSampler(): ISampler {
        return this._defaultTextureSampler;
    }

    /** @inheritdoc */
    public get defaultBlendState(): IBlendState {
        return this._defaultBlendState;
    }

    /** @inheritdoc */
    public get defaultPrimitiveState(): IPrimitiveState {
        return this._defaultPrimitiveState;
    }

    /**
     * Configures and creates the default texture sampler based on the sampler filtering preset specified in the graphics device descriptor. The method creates a new sampler descriptor, sets its properties according to the selected filtering preset, and then creates and returns a new sampler using the configured descriptor.
     * @returns The default texture sampler configured according to the sampler filtering preset specified in the graphics device descriptor.
     */
    protected configureAndCreateDefaultSampler(): ISampler {
        var samplerDescriptor = new SamplerDescriptor();
        samplerDescriptor.minFilter = this._descriptor.samplerFilteringPreset == TextureSamplerFilteringPreset.POINT ? SamplerFilter.NEAREST : SamplerFilter.LINEAR;
        samplerDescriptor.magFilter = this._descriptor.samplerFilteringPreset == TextureSamplerFilteringPreset.POINT ? SamplerFilter.NEAREST : SamplerFilter.LINEAR;
        samplerDescriptor.mipMapFilter = this._descriptor.samplerFilteringPreset == TextureSamplerFilteringPreset.TRILINEAR ? MipMapSamplerFilter.LINEAR : MipMapSamplerFilter.NONE;
        return this.createSampler(samplerDescriptor);
    }

    /** @inheritdoc */
    public initialize(): void {
        this._defaultTextureSampler = this.configureAndCreateDefaultSampler();
        this._defaultBlendState = this.createBlendState(new BlendStateDescriptor());
        this._defaultPrimitiveState = this.createPrimitiveState();
    }

    /** @inheritdoc */
    public abstract createSwapChain(canvas: HTMLCanvasElement, swapChainDescriptor: SwapChainDescriptor): ISwapChain;

    /** @inheritdoc */
    public abstract createSampler(descriptor?: SamplerDescriptor): ISampler;

    /** @inheritdoc */
    public abstract createRenderPass(descriptor: RenderPassDescriptor): IRenderPass;

    /** @inheritdoc */
    public abstract createBlendState(descriptor: BlendStateDescriptor): IBlendState;

    /** @inheritdoc */
    public abstract createPrimitiveState(descriptor?: PrimitiveStateDescriptor ): IPrimitiveState;

    /** @inheritDoc */
    public abstract setupDebugCallback(): void;

    /** @inheritDoc */
    public abstract frameEnd(): void;

    /** @inheritDoc */
    public abstract pushDebugGroup(groupName: string): void;

    /** @inheritDoc */
    public abstract popDebugGroup(): void;

    /** @inheritDoc */
    public dispose(): void {
        this._defaultTextureSampler.dispose();
        this._defaultBlendState.dispose();
    }
}