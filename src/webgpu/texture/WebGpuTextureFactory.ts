import type {ITexture2D, ITexture2DArray, ITextureDescriptor} from "../../api/index.ts";
import {ATextureFactory} from "../../api/rendering/texture/ATextureFactory.ts";
import {WebGpuTexture2D} from "./WebGpuTexture2D.ts";
import {WebGpuTexture2DArray} from "./WebGpuTexture2DArray.ts";

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
     * Creates and initializes a {@link WebGpuTexture2DArray}. Used by `createTexture2DArray` and `createTexture2DArrayFromKtx2`.
     * @inheritDoc
     */
    protected _createAndInitializeTexture2DArray(descriptor: ITextureDescriptor): ITexture2DArray {
        const tex = new WebGpuTexture2DArray(this._framework, descriptor);
        tex.initialize();
        return tex;
    }
}
