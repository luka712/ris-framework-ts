import {type ITextureView2D, TextureFormat, TextureViewDimension} from "../../api/index.ts";

/**
 * The WebGPU texture view. Wraps a native {@link GPUTextureView} created with `GPUTexture.createView`,
 * so every view shares the storage of its texture (no copies).
 * @internal
 */
export class WebGpuTextureView implements ITextureView2D {

    private _gpuTextureView: GPUTextureView | null;

    /**
     * The constructor.
     * @param gpuTextureView The WebGPU view.
     * @param textureFormat The view format.
     * @param dimension The view dimension. By default, `TextureViewDimension.DIMENSION_2D`.
     * @param label The label. By default, none.
     */
    public constructor(gpuTextureView: GPUTextureView, textureFormat: TextureFormat, dimension = TextureViewDimension.DIMENSION_2D, label?: string) {
        this._gpuTextureView = gpuTextureView;
        this.viewFormat = textureFormat;
        this.dimension = dimension;
        this.label = label;
    }

    /** @inheritDoc */
    public readonly viewFormat: TextureFormat;

    /** @inheritDoc */
    public readonly dimension: TextureViewDimension;

    /** @inheritDoc */
    public readonly label?: string;

    /** The WebGPU view. */
    public get gpuTextureView(): GPUTextureView {
        if (!this._gpuTextureView) {
            throw new Error("WebGpuTextureView: the view is disposed.");
        }
        return this._gpuTextureView;
    }

    /** @inheritDoc */
    public get nativeObject(): GPUTextureView {
        return this.gpuTextureView;
    }

    /** @inheritDoc */
    public dispose(): void {
        // Views have no destroy() in WebGPU; dropping the reference is enough.
        this._gpuTextureView = null;
    }
}
