/**
 * The presentation mode of the surface.
 */
export enum SurfacePresentMode {
/**
 * "vsync off"
 *     Draws the frame immediately, without waiting for the screen refresh.
 */
  IMMEDIATE = 0,
/**
 * "vsync on"
 *     Multiple frames can be queued for presentation, but only the last one is displayed.
 *     Typically it is double buffered, which means that the application can queue one frame while the other one is being displayed,
 *     but it can be triple buffered as well, which means that the application can queue two frames while the other one is being displayed.
 */
  FIFO = 1,
/**
 * "fast vsync"
 *     Multiple frames can be queued for presentation, and the first one is displayed.
 */
  MAILBOX = 2
}
