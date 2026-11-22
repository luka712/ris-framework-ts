/**
 * Specifies the action to take with the attachment contents at the end of a render pass.
 */
export enum StoreAction {
/**
 * The attachment contents generated during the render pass are written back to memory.
 */
  STORE = 0,
/**
 * The attachment contents are discarded after the render pass.
 * The texture becomes uninitialized (undefined) afterward.
 * Use this whenever the attachment will not be read by subsequent render passes.
 * If only the depth or stencil aspect is discarded, the other aspect is preserved.
 */
  DISCARD = 1
}
