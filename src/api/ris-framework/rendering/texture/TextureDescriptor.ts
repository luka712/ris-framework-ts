import {TextureFormat} from "./TextureFormat";
import {TextureUsage} from "./TextureUsage";
import {vec2} from "gl-matrix";

/**
 * The texture descriptor.
 */
export class TextureDescriptor {

    /**
     * The texture width.
     */
    public width: number = 0;

    /**
     * The texture height.
     */
    public height: number = 0;

    /**
     * The texture format.
     * By default, it is UNDEFINED.
     */
    public textureFormat = TextureFormat.UNDEFINED;

    /**
     * The texture usage.
     * By default, it is TEXTURE_BINDING | COPY_DST.
     */
    public textureUsage = TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST;

    /**
     * The texture label.
     */
    public label: string | null = null;

    /**
     * The data per mip level.
     */
    public data?: Uint8Array[] = undefined;

    /**
     * Should mipmaps be generated.
     */
    public generateMipmaps = false;

    /**
     * The block size of a texture, which must be set for compressed textures.
     */
    public blockSize?: vec2;

}
