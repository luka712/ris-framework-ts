import type {ITexture2D, ITexture2DArray, ITextureDescriptor} from "../../api/index.ts";
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

    /**
     * Not implemented for WebGPU yet; always throws.
     * @inheritDoc
     */
    protected _createAndInitializeTexture2DArray(_descriptor: ITextureDescriptor): ITexture2DArray {
        throw new Error(`WebGpuTextureFactory.createTexture2DArray: 2D texture arrays are not implemented for WebGPU yet ('${_descriptor.label ?? "unlabeled"}'). Use the WebGL backend.`);
    }
}
