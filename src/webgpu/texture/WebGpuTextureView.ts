import {type ITextureView, TextureFormat, TextureViewDimension} from "../../api/index.ts";
import type {GpuTextureView} from "../WebGpuTypes.ts";

/**
 * The WebGPU texture view.
 * @internal
 */
export class WebGpuTextureView implements ITextureView {

    private _gpuTextureView: GpuTextureView | null;

    /**
     * The constructor.
     * @param gpuTextureView The WebGPU view.
     * @param textureFormat The view format.
     * @param dimension The view dimension.
     */
    public constructor(gpuTextureView: GpuTextureView, textureFormat: TextureFormat, dimension = TextureViewDimension.DIMENSION_2D) {
        this._gpuTextureView = gpuTextureView;
        this.textureFormat = textureFormat;
        this.dimension = dimension;
    }

    /** @inheritDoc */
    public readonly textureFormat: TextureFormat;

    /** @inheritDoc */
    public readonly dimension: TextureViewDimension;

    /** The WebGPU view. */
    public get gpuTextureView(): GpuTextureView {
        if (!this._gpuTextureView) {
            throw new Error("WebGpuTextureView: the view is disposed.");
        }
        return this._gpuTextureView;
    }

    /** @inheritDoc */
    public dispose(): void {
        // Views have no destroy() in WebGPU; dropping the reference is enough.
        this._gpuTextureView = null;
    }
}
