/**
 * The time information.
 */
export class GameTime {

    /**
     * Total elapsed time in milliseconds.
     */
    public elapsedTimeMs: number = 0;

    /**
     * Elapsed time in seconds.
     */
    public get elapsedTimeSec() {
        return this.elapsedTimeMs / 1000;
    }

    /**
     * Delta time in milliseconds.
     * This is the time between the current frame and the last frame in milliseconds.
     */
    public deltaTimeMs: number = 0;

    /**
     * Delta time in seconds. This is the time between the current frame and the last frame in seconds.
     */
    public get deltaTimeSec() {
        return this.deltaTimeMs / 1000;
    }
}
