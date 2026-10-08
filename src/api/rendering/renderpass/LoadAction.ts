/**
 * Specifies the action to take with the attachment contents at the beginning of a render pass.
 */
export enum LoadAction {
/**
 * The attachment is cleared to a specified clear value at the start of the render pass.
 *     
 *     On tile-based renderers (especially mobile),  is usually much cheaper than 
 *     because it avoids loading data from main memory into tile memory.
 *     
 *     Recommended when the previous contents don't matter (e.g. rendering a skybox, full-screen quad, or when you know you'll overwrite everything).
 *     
 *     Corresponds to WebGPU clear operation.
 */
  CLEAR = 0,
/**
 * The existing contents of the attachment are loaded into the render pass.
 *     
 *     Corresponds to WebGPU load operation.
 */
  LOAD = 1,
/**
 * The attachment contents at the start of the render pass are undefined.
 *     This is the fastest possible load operation if you guarantee that **every pixel** will be written before it is read.
 *     Warning: Reading from any pixel (including via blending) before writing to it results in undefined behavior.
 *     
 *     Backends that do not natively support "don't care" will fall back to another load operation (implementation-defined).
 *     
 *     Corresponds to WebGPU undefined / discard (historically "dontcare").
 */
  UNDEFINED = 2
}
