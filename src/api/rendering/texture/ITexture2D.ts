import type { ITextureView2D } from "./ITextureView2D.ts";
import type { IContent } from "../../content/IContent.ts";
import {TextureUsage} from "./TextureUsage.ts";
import {State} from "../../data/State.ts";
import {TextureFormat} from "./TextureFormat.ts";
import type {vec2} from "gl-matrix";

/**
 * The texture 2D interface.
 */
export interface ITexture2D extends IContent {

    /**
     * The default texture view, i.e. the view in the texture's own {@link textureFormat}.
     * Same as `getTextureView(textureFormat)`. Only available once the texture is initialized.
     * On WebGL2 (`supportsTextureView` is false) this throws — use the texture directly.
     */
    readonly defaultTextureView: ITextureView2D;

    /** The texture usage. */
    readonly textureUsage: TextureUsage;

    /** The texture format. */
    readonly textureFormat: TextureFormat;

    /**
     * The available texture view formats for this texture. Always contains {@link textureFormat}, followed by
     * the descriptor's `viewFormats`. By default, only {@link textureFormat}.
     */
    readonly viewFormats: TextureFormat[];

    /**
     * The id of the texture.
     */
    readonly id: number;

    /**
     * The handle of the underlying graphics API texture object.
     */
    readonly handle?: any;

    /** The label of the texture. The label is used as a label of underlying GPU texture. */
    readonly label?: string;

    /**
     * The current state.
     */
    readonly textureState: State;

    /**
     * The approximate size of this texture in VRAM, in bytes, computed from the native size.
     * Note that it is a rough approximation, as the real size depends on the driver implementation.
     */
    readonly vramSize: number;

    /**
     * The logical size of the texture [width, height] in pixels, as described by the texture data
     * (e.g. 768x512 for a 768x512 KTX2 image). Use this for sprite sizes, UVs and layout.
     * Do not modify the returned vector.
     */
    readonly size: vec2;

    /**
     * The native size of the texture [width, height] in pixels, i.e. the size actually allocated on the GPU.
     * For block-compressed formats on backends that require it (WebGPU), this is the logical size rounded up
     * to whole blocks (e.g. ASTC 10x5 at 768x512 -> 770x515). Otherwise, it is equal to `size`.
     * Do not modify the returned vector.
     */
    readonly nativeSize: vec2;

    /**
     * The number of mipmap levels.
     */
    readonly mipLevels: number;

    /**
     * The event that is raised when the texture is disposed.
     */
    addOnDisposedListener(event: (obj: ITexture2D) => void): void;

    /**
     * The event that is raised when the texture is disposed.
     */
    removeOnDisposedListener(event: (obj: ITexture2D) => void): void;

    /**
     * Gets the texture view for the specified view format. The view is created on first request and cached,
     * so repeated calls return the same view. Views are disposed together with the texture.
     * In WebGPU this is a native view (`GPUTexture.createView`), so all views share the same storage.
     * WebGL2 does not support texture views (`supportsTextureView` is false); requesting a view throws.
     * @param textureFormat The view format. Must be one of {@link viewFormats}, otherwise an error is thrown.
     * @returns The texture view.
     */
    getTextureView(textureFormat: TextureFormat): ITextureView2D;

    /**
     * Initializes the texture.
     */
    initialize(): void;

}
