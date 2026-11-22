import {GameTime} from "./GameTime.ts";

/**
 * The time manager interface.
 * @public
 */
export interface ITimeManager {

    /** 
     * Gets the time information.
     * @public
     **/
    readonly time: GameTime;

    /**
     * The current frame.
     * @public
     */
    readonly currentFrame: number;

    /** 
     * Called once before the first frame starts to prepare the time.
     * @internal
     **/
    prepareStart(): void;

    /** 
     * Called internally at the start of the frame.
     * @internal
     */
    frameStart(): void;
}
