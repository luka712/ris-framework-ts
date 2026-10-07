import type { ISwapChain } from "../swapchain/ISwapChain.ts";
import {Color} from "../../data/Color.ts";
import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { ITextureView } from "../texture/ITextureView.ts";
import {StoreAction} from "./StoreAction.ts";
import {LoadAction} from "./LoadAction.ts";

/**
 * Color attachment for a render pass.
 */
export class RenderPassColorAttachment {

    /**
     * The swap chain to which the render pass will write for this attachment.
     */
    public swapChain?: ISwapChain;

    /**
     * The texture to which the render pass will write for this attachment.
     * Must be defined if view is not defined.
     */
    public texture?: ITexture2D;

    /**
     * The view into  to which the render pass will write for this attachment.
     * Must be defined if texture is not defined.
     */
    public view?: ITextureView;

    /**
     * Whether data will be written to through this attachment.
     * Note that resolve textures (if specified) are always written to, regardless of this setting.
     * By default, it is set to STORE, which means that the data will be stored in memory after the render pass and can be read later.
     */
    public storeAction: StoreAction = StoreAction.STORE;

    /**
     * How data should be read through this attachment.
     *  By default, it is set to CLEAR, which means that the data will be cleared at the beginning of the render pass.
     */
    public loadAction: LoadAction = LoadAction.CLEAR;

    /**
     * The texture that will receive the resolved output if multisampling is used.
     * If set, it is always written to, regardless of how Self::ops is configured.
     *
     * Can be used instead of  if texture has default view or rendering
     * backend does not support .
     */
    public resolveTexture?: ITexture2D;

    /**
     * The texture view that will receive the resolved output if multisampling is used.
     * If set, it is always written to, regardless of how Self::ops is configured.
     * Can be used instead of  if rendering backend supports .
     */
    public resolveView?: ITextureView;

    /**
     * Clear color for the attachment.
     */
    public clearColor = Color.black();
}
