import {ITextureView} from "./ITextureView";
import {IContent} from "../../content/IContent";
import {TextureUsage} from "./TextureUsage";
import {State} from "../../data/State";
import {TextureViewDescriptor} from "./TextureViewDescriptor";
import {TextureFormat} from "./TextureFormat";

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

    /**
     * The label.
     */
    readonly label: string | null;

    /**
     * The current state.
     */
    readonly textureState: State;

    /**
     * The size of this texture in RAM.
     * Note that size if rough approximation as real size can depend on driver implementation.
     */
    readonly size: number;

    /**
     * The width of the texture.
     */
    readonly width: number;

    /**
     * The height of the texture.
     */
    readonly height: number;

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
