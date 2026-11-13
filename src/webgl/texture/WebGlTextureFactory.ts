import type {ITexture2D, ITexture2DArray, ITextureDescriptor} from "../../api";
import {State} from "../../api";
import type {IDisposable} from "../../api/core/IDisposable.ts";
import {ATextureFactory} from "../../api/rendering/texture/ATextureFactory.ts";
import {WebGlTexture2D} from "./WebGlTexture2D.ts";
import {WebGlTexture2DArray} from "./WebGlTexture2DArray.ts";

/**
 * The WebGL texture factory. The shared logic lives in {@link ATextureFactory}.
 * Owns the framework's default 1x1 white textures and disposes them in {@link dispose}.
 * @internal
 */
export class WebGlTextureFactory extends ATextureFactory implements IDisposable {

    private _defaultTexture2D: WebGlTexture2D | null = null;
    private _defaultTexture2DArray: WebGlTexture2DArray | null = null;
    private _disposed = false;

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

    /**
     * Returns the 1x1 white texture, creating it on first use (or again if someone disposed it).
     * Pipelines bind it when no texture is set.
     * @returns The default texture, owned by this factory.
     * @throws Error when the factory is disposed.
     */
    public getOrCreateDefaultTexture2D(): WebGlTexture2D {
        this._throwIfDisposed("getOrCreateDefaultTexture2D");
        if (!this._defaultTexture2D || this._defaultTexture2D.state === State.DISPOSED) {
            this._defaultTexture2D = new WebGlTexture2D(this._framework, {
                width: 1,
                height: 1,
                data: [new Uint8Array([255, 255, 255, 255])],
                textureFormat: this._framework.renderer.preferredTextureFormat,
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
    public getOrCreateDefaultTexture2DArray(): WebGlTexture2DArray {
        this._throwIfDisposed("getOrCreateDefaultTexture2DArray");
        if (!this._defaultTexture2DArray || this._defaultTexture2DArray.state === State.DISPOSED) {
            this._defaultTexture2DArray = new WebGlTexture2DArray(this._framework, {
                width: 1,
                height: 1,
                dataArray: [[new Uint8Array([255, 255, 255, 255])]],
                textureFormat: this._framework.renderer.preferredTextureFormat,
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
            throw new Error(`WebGlTextureFactory.${method}: the factory is disposed.`);
        }
    }
}
