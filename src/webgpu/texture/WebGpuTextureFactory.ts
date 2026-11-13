import type {ITexture2D, ITexture2DArray, ITextureDescriptor} from "../../api/index.ts";
import {State, TextureUsage} from "../../api/index.ts";
import type {IDisposable} from "../../api/core/IDisposable.ts";
import {ATextureFactory} from "../../api/rendering/texture/ATextureFactory.ts";
import {WebGpuTexture2D} from "./WebGpuTexture2D.ts";
import {WebGpuTexture2DArray} from "./WebGpuTexture2DArray.ts";

/**
 * The WebGPU texture factory. The shared logic lives in {@link ATextureFactory}.
 * Owns the framework's default 1x1 white textures and disposes them in {@link dispose}.
 * @internal
 */
export class WebGpuTextureFactory extends ATextureFactory implements IDisposable {

    private _defaultTexture2D: WebGpuTexture2D | null = null;
    private _defaultTexture2DArray: WebGpuTexture2DArray | null = null;
    private _disposed = false;

    /** @inheritDoc */
    protected _createAndInitializeTexture(descriptor: ITextureDescriptor): ITexture2D {
        const tex = new WebGpuTexture2D(this._framework, descriptor);
        tex.initialize();
        return tex;
    }

    /** @inheritDoc */
    protected _createAndInitializeTexture2DArray(descriptor: ITextureDescriptor): ITexture2DArray {
        const tex = new WebGpuTexture2DArray(this._framework, descriptor);
        tex.initialize();
        return tex;
    }

    /**
     * Returns the 1x1 white texture, creating it on first use (or again if someone disposed it).
     * Pipelines bind it when no texture is set.
     * @returns The default texture, owned by this factory.
     * @throws Error when the factory is disposed.
     */
    public getOrCreateDefaultTexture2D(): WebGpuTexture2D {
        this._throwIfDisposed("getOrCreateDefaultTexture2D");
        if (!this._defaultTexture2D || this._defaultTexture2D.state === State.DISPOSED) {
            this._defaultTexture2D = new WebGpuTexture2D(this._framework, {
                width: 1,
                height: 1,
                data: [new Uint8Array([255, 255, 255, 255])],
                textureFormat: this._framework.renderer.preferredTextureFormat,
                textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
                label: "RisDefaultFilledTexture",
            });
            this._defaultTexture2D.initialize();
        }
        return this._defaultTexture2D;
    }

    /**
     * Returns the 1x1, one-layer white texture array, creating it on first use (or again if someone disposed it).
     * Pipelines bind it when no texture array is set.
     * @returns The default texture array, owned by this factory.
     * @throws Error when the factory is disposed.
     */
    public getOrCreateDefaultTexture2DArray(): WebGpuTexture2DArray {
        this._throwIfDisposed("getOrCreateDefaultTexture2DArray");
        if (!this._defaultTexture2DArray || this._defaultTexture2DArray.state === State.DISPOSED) {
            this._defaultTexture2DArray = new WebGpuTexture2DArray(this._framework, {
                width: 1,
                height: 1,
                layers: 1,
                dataArray: [[new Uint8Array([255, 255, 255, 255])]],
                textureFormat: this._framework.renderer.preferredTextureFormat,
                textureUsage: TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST,
                label: "RisDefaultFilledTextureArray",
            });
            this._defaultTexture2DArray.initialize();
        }
        return this._defaultTexture2DArray;
    }

    /** Disposes the default texture and texture array. Calling it twice does nothing. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._defaultTexture2D?.dispose();
        this._defaultTexture2D = null;
        this._defaultTexture2DArray?.dispose();
        this._defaultTexture2DArray = null;
    }

    private _throwIfDisposed(method: string): void {
        if (this._disposed) {
            throw new Error(`WebGpuTextureFactory.${method}: the factory is disposed.`);
        }
    }
}
