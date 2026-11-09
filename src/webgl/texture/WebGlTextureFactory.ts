import type {ITexture2D, ITexture2DArray, ITextureDescriptor} from "../../api";
import {ATextureFactory} from "../../api/rendering/texture/ATextureFactory.ts";
import {WebGlTexture2D} from "./WebGlTexture2D.ts";
import {WebGlTexture2DArray} from "./WebGlTexture2DArray.ts";

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

    /** @inheritDoc */
    protected _createAndInitializeTexture2DArray(descriptor: ITextureDescriptor): ITexture2DArray {
        const tex = new WebGlTexture2DArray(this._framework, descriptor);
        tex.initialize();
        return tex;
    }
}
