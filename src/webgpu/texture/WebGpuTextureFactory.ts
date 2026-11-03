import type {ITexture2D, ITextureDescriptor} from "../../api/index.ts";
import {ATextureFactory} from "../../api/rendering/texture/ATextureFactory.ts";
import {WebGpuTexture2D} from "./WebGpuTexture2D.ts";

/**
 * The WebGPU texture factory. The shared logic lives in {@link ATextureFactory}.
 * @internal
 */
export class WebGpuTextureFactory extends ATextureFactory {

    /** @inheritDoc */
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        const tex = new WebGpuTexture2D(this._framework, descriptor);
        tex.initialize();
        return tex;
    }
}
