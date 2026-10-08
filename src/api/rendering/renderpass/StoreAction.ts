/**
 * Specifies the action to take with the attachment contents at the end of a render pass.
 */
export enum StoreAction {
/**
 * The attachment contents generated during the render pass are written back to memory.
 *     
 *     Corresponds to WebGPU store operation.
 */
  STORE = 0,
/**
 * The attachment contents are discarded after the render pass.
 *     The texture becomes uninitialized (undefined) afterward.
 *     
 *     On tile-based GPUs (most mobile/Apple Silicon), this is significantly faster because it avoids writing data back to main memory.
 *     Use this whenever the attachment will not be read by subsequent render passes.
 *     
 *     Note: If only the depth or stencil aspect is discarded, the other aspect is preserved.
 *     
 *     Corresponds to WebGPU discard operation.
 */
  DISCARD = 1
}
