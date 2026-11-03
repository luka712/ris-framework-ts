import type { ITextureView } from "./ITextureView.ts";
import type { IContent } from "../../content/IContent.ts";
import {TextureUsage} from "./TextureUsage.ts";
import {State} from "../../data/State.ts";
import {TextureViewDescriptor} from "./TextureViewDescriptor.ts";
import {TextureFormat} from "./TextureFormat.ts";
import type {vec2} from "gl-matrix";

/**
 * The texture 2D interface.
 */
export interface ITexture2D extends IContent {

    /**
     * The default texture view.
     * It is created with default parameters and can be used when no specific view is needed.
     */
    readonly defaultTextureView: ITextureView;

    /**
     * The texture usage.
     */
    readonly textureUsage: TextureUsage;

    /**
     * The texture format.
     */
    readonly textureFormat: TextureFormat;

    /**
     * The texture view format.
     * In most cases it will be the same as the texture format, but in some cases it can be different.
     *
     * Case where it might differ is if texture is used as depth texture and shader binding.
     */
    readonly textureViewFormat: TextureFormat;

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
     * Creates the texture view with the specified description.
     * @param descriptor - The texture view descriptor.
     * @returns The texture view.
     */
    createView(descriptor?: TextureViewDescriptor): ITextureView;

    /**
     * Initializes the texture.
     */
    initialize(): void;

}
