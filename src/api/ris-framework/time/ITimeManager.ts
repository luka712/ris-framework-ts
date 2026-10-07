import {GameTime} from "./GameTime";

/**
 * The time manager interface.
 */
export interface ITimeManager {

    /**
     * Gets the time information.
     */
    readonly time: GameTime;

    /**
     * Called once before the first frame starts to prepare the time.
     */
    prepareStart(): void;

    /**
     * Should be called at the start of the frame.
     */
    frameStart(): void;
}
