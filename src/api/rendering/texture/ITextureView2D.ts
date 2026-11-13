import {TextureFormat} from "./TextureFormat.ts";
import type {IDisposable} from "../../core/IDisposable.ts";
import {TextureViewDimension} from "./TextureViewDimension.ts";

/**
 * The interface for 2D texture view.
 */
export interface ITextureView2D extends IDisposable {

    /**
     * The native object.
     * WebGPU: {@link GPUTextureView}.
     * WebGL2 does not support texture views (`supportsTextureView` is false); this interface is unused there.
     */
    readonly nativeObject: any;

    /** The texture format of the texture view. */
    readonly viewFormat: TextureFormat;

    /** The dimension of the texture view. */
    readonly dimension: TextureViewDimension;

    /** The label. */
    readonly label?: string;
}
