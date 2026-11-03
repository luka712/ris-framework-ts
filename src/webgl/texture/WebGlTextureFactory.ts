import type {ITexture2D, ITextureDescriptor} from "../../api/index.ts";
import {ATextureFactory} from "../../api/rendering/texture/ATextureFactory.ts";
import {WebGlTexture2D} from "./WebGlTexture2D.ts";

/**
 * The WebGL texture factory. The shared logic lives in {@link ATextureFactory}.
 * @internal
 */
export class WebGlTextureFactory extends ATextureFactory {

    /** @inheritDoc */
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        const tex = new WebGlTexture2D(this._framework, descriptor);
        tex.initialize();
        return tex;
    }
}
