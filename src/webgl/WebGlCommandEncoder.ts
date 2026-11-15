import type { IGpuCommandEncoder } from "../api/gpu/IGpuCommandEncoder.ts";

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
}
