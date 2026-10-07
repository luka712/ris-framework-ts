import {IDisposable} from "../../core/IDisposable";

/**
 * The render pass interface.
 */
export interface IRenderPass extends IDisposable {

/**
 * Begins the render pass. This will set up the necessary state and resources for the render pass to be executed.
 */
  beginPass(): void;

/**
 * Ends the render pass. This will finalize the render pass and submit the recorded commands for execution.
 */
  endPass(): void;

}
