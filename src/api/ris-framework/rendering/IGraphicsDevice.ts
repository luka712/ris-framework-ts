import {IDisposable} from "../core/IDisposable";
import {IGPUInfo} from "./IGPUInfo";
import {IGraphicsDeviceFeatures} from "./IGraphicsDeviceFeatures";
import {ISampler} from "./sampler/ISampler";
import {IBlendState} from "./blending/IBlendState";
import {IPrimitiveState} from "./primitive/IPrimitiveState";
import {RenderPassDescriptor} from "./renderpass/RenderPassDescriptor";
import {IRenderPass} from "./renderpass/IRenderPass";
import {SwapChainDescriptor} from "./swapchain/SwapChainDescriptor";
import {ISwapChain} from "./swapchain/ISwapChain";
import {SamplerDescriptor} from "./sampler/SamplerDescriptor";
import {PrimitiveStateDescriptor} from "./primitive/PrimitiveStateDescriptor";

/**
 * The interface for a graphics device.
 */
export interface IGraphicsDevice extends IDisposable {

    /**
     * The info about the GPU.
     */
    readonly gpuInfo: IGPUInfo;

    /**
     * The features of the graphics device.
     */
    readonly features: IGraphicsDeviceFeatures;

    /**
     * Gets the default sampler for the graphics device.
     */
    readonly defaultTextureSampler: ISampler;

    /**
     * Gets the default blend state for the graphics device.
     * All render pipelines will use this blend state by default.
     */
    readonly defaultBlendState: IBlendState;

    /**
     * Gets the default primitive state for the graphics device.
     * All render pipelines will use this primitive state by default.
     */
    readonly defaultPrimitiveState: IPrimitiveState;

    /**
     * Initializes the graphics device.
     */
    initialize(): void;

    /**
     * Sets up the debug callback for the graphics device.
     * This will enable the debug output if it is supported, and set the debug message callback to the  event.
     */
    setupDebugCallback(): void;

    /**
     * Called at the end of each frame to perform any necessary cleanup of resources that were used during the frame.
     */
    frameEnd(): void;

    /**
     * Create a sampler object.
     * @param samplerDescriptor - The sampler descriptor.
     * @returns The sampler.
     */
    createSampler(samplerDescriptor: SamplerDescriptor): ISampler;

    /**
     * Creates a primitive state for the graphics device.
     * @param descriptor - The primitive state descriptor.
     * @returns The created primitive state.
     */
    createPrimitiveState(descriptor: PrimitiveStateDescriptor): IPrimitiveState;

    /**
     * Creates a render pass for the graphics device.
     * @param descriptor - The descriptor for creating a render pass.
     * @returns The created  instance.
     */
    createRenderPass(descriptor: RenderPassDescriptor): IRenderPass;

    /**
     * // TODO: fix this for window.
     * Creates a swap chain for the graphics device.
     * The swap chain is used to present the rendered image to the screen.
     * @returns The  instance.
     */
    createSwapChain(window: any, swapChainDescription: SwapChainDescriptor): ISwapChain;

    /**
     * Pushes a debug group with the specified name onto the graphics device's debug stack.
     * @param groupName - The name of the debug group.
     */
    pushDebugGroup(groupName: string): void;

    /**
     * Pops the current debug group from the graphics device's debug stack,
     * ending the current debug group and returning to the previous one.
     */
    popDebugGroup(): void;

}
