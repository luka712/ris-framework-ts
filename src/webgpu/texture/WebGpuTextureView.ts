import {
    type IFramework,
    type ITextureView2D,
    type ITextureViewDescriptor,
    type TextureFormat,
    TextureViewDimension,
} from "../../api/index.ts";
import {vec2} from "gl-matrix";
import {WebGpuUtilities} from "../utilities/WebGpuUtilities.ts";
import type {WebGpuTexture2D} from "./WebGpuTexture2D.ts";
import type {WebGpuTexture2DArray} from "./WebGpuTexture2DArray.ts";

/**
 * The WebGPU texture view. Wraps a native {@link GPUTextureView} created with `GPUTexture.createView`,
 * so every view shares the storage of its texture (no copies).
 * @internal
 */
export class WebGpuTextureView implements ITextureView2D {

    private _gpuTextureView: GPUTextureView | null;

    /**
     * The constructor.
     * @param framework The framework.
     * @param texture The texture this view is created from.
     * @param descriptor The view descriptor.
     */
    public constructor(_framework: IFramework, texture: WebGpuTexture2D | WebGpuTexture2DArray, descriptor: ITextureViewDescriptor) {
        let viewFormat = descriptor.viewFormat;
        if (viewFormat === undefined) {
            viewFormat = texture.textureFormat;
        }
        let dimension = descriptor.dimension;
        if (dimension === undefined) {
            dimension = TextureViewDimension.DIMENSION_2D;
            if (texture.size.length > 2) {
                dimension = TextureViewDimension.DIMENSION_2D_ARRAY;
            }
        }
        this.viewFormat = viewFormat;
        this.dimension = dimension;
        this.label = descriptor.label;

        let mip = 0;
        if (descriptor.baseMipLevel !== undefined) {
            mip = descriptor.baseMipLevel;
        }
        this.size = vec2.fromValues(Math.max(1, texture.size[0] >> mip), Math.max(1, texture.size[1] >> mip));
        this._gpuTextureView = WebGpuUtilities.textureView.create(texture.gpuTexture, {
            label: descriptor.label,
            dimension,
            viewFormat,
            baseMipLevel: descriptor.baseMipLevel,
            mipLevelCount: descriptor.mipLevelCount,
            baseArrayLayer: descriptor.baseArrayLayer,
            arrayLayerCount: descriptor.arrayLayerCount,
        });

    }

    /** @inheritDoc */
    public readonly viewFormat: TextureFormat;

    /** @inheritDoc */
    public readonly size: vec2;

    /** @inheritDoc */
    public readonly dimension: TextureViewDimension;

    /** @inheritDoc */
    public readonly label?: string;

    /** The WebGPU view. */
    public get gpuTextureView(): GPUTextureView {
        return this._gpuTextureView!;
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
