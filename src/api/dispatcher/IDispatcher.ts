import type { GameTime } from "../_export";

/** TODO */
export interface IDispatcher {

    /** 
     * The current frame in dispatcher. Set by engine, it should never be changed.
     * @internal
     */
    currentFrame: number;

    /**
     * Adds action that will be run on next frame and removed afterwards.
     * @param action The next update frame callback.
     * @public 
     **/
    addNextUpdateFrameAction(action: (gt: GameTime) => void) : void;

    /** 
     * Runs the dispatcher update frames.
     * @param gt The game time.
     * @internal
     */
    runUpdateActions(gt: GameTime) : void;

}