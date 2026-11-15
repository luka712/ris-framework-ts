import type {IDisposable} from "../../../core/IDisposable.ts";
import type {RenderPassColorAttachment} from "./RenderPassColorAttachment.ts";

/**
 * The render pass interface.
 */
export interface IRenderPass extends IDisposable {

  /**
   * Sets the color attachments at specified index.
   * @param index The index.
   * @param value The color attachment.
   */
    setColorAttachment(index: number, value: RenderPassColorAttachment): void;

    /** Begins the render pass. This will set up the necessary state and resources for the render pass to be executed. */
    beginPass(): void;

    /** Ends the render pass. Does not submit the command encoder. */
    endPass(): void;

    /**
     * Submits this pass's command encoder, if it is not the main encoder.
     * The main command encoder is submitted by {@link IGraphicsDevice.frameEnd}.
     * @internal
     */
    submit(): void;


    /**
     * Pushes the debug group onto current render pass.
     * @param label The label.
     * @public
     */
    pushDebugGroup(label: string): void;

    /**
     * Pops the debug group from current render pass.
     * @public
     */
    popDebugGroup(): void;
}
