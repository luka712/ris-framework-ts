/**
 * The descriptor for the texture view.
 *     It contains the parameters that are used to create a texture view.
 */
import {TextureViewDimension} from "./TextureViewDimension";
import {TextureFormat} from "./TextureFormat";

export class TextureViewDescriptor {

    /**
     * The label of the texture view.
     */
    public label?: string;

    /**
     * The dimension of the texture view.
     *     It is used to specify the type of the texture view and how it will be used in shaders.
     */
    public dimension: TextureViewDimension = TextureViewDimension.DIMENSION_2D;

    /**
     * The texture format of the texture view.
     */
    public textureFormat: TextureFormat = TextureFormat.RGBA_8_UNORM;
}
