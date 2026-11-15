import type { IContent } from "../../content/IContent.ts";
import {TextureUsage} from "./TextureUsage.ts";
import {State} from "../../data/State.ts";
import {TextureFormat} from "./TextureFormat.ts";
import type {vec2} from "gl-matrix";
import type { ITextureView2D } from "./view/ITextureView2D.ts";
import type { ITextureViewDescriptor } from "./view/ITextureViewDescriptor.ts";

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
     * The approximate size of this texture in VRAM, in bytes, computed from {@link size}.
     * Note that it is a rough approximation, as the real size depends on the driver implementation.
     */
    readonly vramSize: number;

    /**
     * The size of the texture [width, height] in pixels, from the descriptor's `width` and `height`
     * (both are required and must be greater than zero). Use this for sprite sizes, UVs and layout.
     * Do not modify the returned vector.
     */
    readonly size: vec2;

    /**
     * The number of mipmap levels.
     */
    readonly mipLevels: number;

    /**
     * Adds a listener that is called when the texture is disposed.
     * @param event The listener. Receives the disposed texture.
     */
    addOnDisposedListener(event: (obj: ITexture2D) => void): void;

    /**
     * Removes a listener added with {@link addOnDisposedListener}. Does nothing if it was not added.
     * @param event The listener to remove.
     */
    removeOnDisposedListener(event: (obj: ITexture2D) => void): void;

    /**
     * Gets a cached texture view in `textureFormat`. Same as {@link defaultTextureView} when `textureFormat` is the texture's own format.
     * @param textureFormat The view format. Must be one of {@link viewFormats}.
     * @returns The texture view.
     */
    getTextureView(textureFormat: TextureFormat): ITextureView2D;

    /**
     * Creates a texture view described by `descriptor`. Use this to view a single mip level or array layer.
     * @param descriptor The view descriptor. `viewFormat` must be one of {@link viewFormats}.
     * @returns The texture view.
     */
    createView(descriptor: ITextureViewDescriptor): ITextureView2D;

    /**
     * Initializes the texture: creates the native texture and uploads the data. Factories call it for you.
     * @throws Error when the texture is already initialized or disposed.
     */
    initialize(): void;
}
