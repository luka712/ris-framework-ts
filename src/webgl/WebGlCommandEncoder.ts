import type { IGpuCommandEncoder, ITextureCopyRegion } from "../api/gpu/IGpuCommandEncoder.ts";
import type { IDisposable } from "../api/core/IDisposable.ts";

/**
 * A no-op command encoder. WebGL2 has no command buffers; start and submit do nothing.
 * @internal
 */
export class WebGlCommandEncoder implements IGpuCommandEncoder {

    /** @inheritdoc */
    public start(): void {
    }

    /** @inheritdoc */
    public submit(): void {
    }

    /**
     * @inheritdoc
     * @ai-generated
     */
    public copyTextureToTexture(_source: ITextureCopyRegion, _destination: ITextureCopyRegion, _arrayLayerCount?: number): void {
        throw new Error("Not implemented");
    }

    /**
     * @inheritdoc
     * @ai-generated
     */
    public queueDispose(_disposable: IDisposable): void {
    }

    /**
     * @inheritdoc
     * @ai-generated
     */
    public dispose(): void {
    }
}
