/**
 * Specifies the action to take with the attachment contents at the beginning of a render pass.
 */
export enum LoadAction {
/**
 * The attachment is cleared to a specified clear value at the start of the render pass.
 * Recommended when the previous contents don't matter (e.g. rendering a skybox, a full-screen quad, or when you know you'll overwrite everything).
 */
  CLEAR = 0,
/**
 * The existing contents of the attachment are loaded into the render pass.
 */
  LOAD = 1,
/**
 * The attachment contents at the start of the render pass are undefined.
 * This is the fastest possible load operation if you guarantee that **every pixel** will be written before it is read.
 * Warning: Reading from any pixel (including via blending) before writing to it results in undefined behavior.
 */
  UNDEFINED = 2
}
