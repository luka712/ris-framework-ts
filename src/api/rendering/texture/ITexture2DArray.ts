import type {ITextureView2D} from "./ITextureView2D.ts";
import type {IContent} from "../../content/IContent.ts";
import {TextureUsage} from "./TextureUsage.ts";
import {State} from "../../data/State.ts";
import {TextureFormat} from "./TextureFormat.ts";
import type {vec3} from "gl-matrix";

/**
 * A 2D texture array: `layers` images of the same size and format, sampled in shaders as `sampler2DArray` (GLSL)
 * or `texture_2d_array` (WGSL). Create one with {@link ITextureFactory.createTexture2DArray} or
 * {@link IContentManager.loadTexture2DArrayAsync}.
 */
export interface ITexture2DArray extends IContent {

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

    /** The current state. */
    readonly textureState: State;

    /**
     * The approximate size of this texture in VRAM, in bytes, computed from {@link size}.
     * Note that it is a rough approximation, as the real size depends on the driver implementation.
     */
    readonly vramSize: number;

    /**
     * The size of the texture [width, height, layers]: the size of one layer in pixels, and the layer count.
     * From the descriptor's `width`, `height` and `layers` (or the length of `dataArray`). Do not modify the returned vector.
     */
    readonly size: vec3;

    /**
     * The number of mipmap levels. Every layer has the same number of levels.
     */
    readonly mipLevels: number;

    /**
     * Adds a listener that is called when the texture is disposed.
     * @param event The listener. Receives the disposed texture.
     */
    addOnDisposedListener(event: (obj: ITexture2DArray) => void): void;

    /**
     * Removes a listener added with {@link addOnDisposedListener}. Does nothing if it was not added.
     * @param event The listener to remove.
     */
    removeOnDisposedListener(event: (obj: ITexture2DArray) => void): void;

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
     * Initializes the texture: creates the native texture and uploads the data. Factories call it for you.
     * @throws Error when the texture is already initialized or disposed.
     */
    initialize(): void;
}
