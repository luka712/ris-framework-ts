
import {ITextureView} from "../texture/ITextureView";
import {LoadAction} from "./LoadAction";
import {ITexture2D} from "../texture/ITexture2D";
import {StoreAction} from "./StoreAction";


/**
 * Describes a depth/stencil attachment used in a render pass.
 * Controls how depth and stencil buffers are loaded, cleared, and stored.
 */
export class RenderPassDepthStencilAttachment {

    /**
     * The constructor.
     */
    public constructor() {
        this.depthLoadAction = LoadAction.CLEAR;
        this.depthStoreAction = StoreAction.DISCARD;
        this.depthClearValue = 1.0;
        this.stencilLoadAction = LoadAction.CLEAR;
        this.stencilStoreAction = StoreAction.DISCARD;
        this.stencilClearValue = 0;
    }

    /**
     * The view into depth/stencil render target.
     */
    public view?: ITextureView;

    /**
     * The texture used as depth/stencil render target.
     * Can be used instead of 'view' property if 'view' is not supported
     *  for the rendering backend.
     */
    public texture?: ITexture2D;

    /**
     * What happens to the depth buffer at the start of the render pass.
     *     By default, it is set to , which means that the depth buffer will be cleared at the beginning of the render pass.
     */
    public depthLoadAction: LoadAction;

    /**
     * What happens to the depth buffer at the end of the render pass.
     *     By default, it is set to , which means that the depth buffer will be discarded after the render pass and cannot be read later.
     */
    public depthStoreAction: StoreAction;

    /**
     * Depth value used when DepthLoadAction is Clear.
     *     Typically, 1.0 (far plane).
     *     Ignored otherwise.
     */
    public depthClearValue: number;


    /**
     * What happens to the stencil buffer at the start of the render pass.
     *     By default, it is set to , which means that the stencil buffer will be cleared at the beginning of the render pass.
     */
    public stencilLoadAction: LoadAction;


    /**
     * What happens to the stencil buffer at the end of the render pass.
     *     By default, it is set to , which means that the stencil buffer will be discarded after the render pass and cannot be read later.
     */
    public stencilStoreAction: StoreAction;

    /**
     * Stencil value used when StencilLoadAction is Clear.
     *     Ignored otherwise.
     */
    public stencilClearValue: number;
}
