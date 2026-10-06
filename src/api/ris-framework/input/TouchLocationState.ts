/**
 * The state of a touch location for the current frame.
 */
export enum TouchLocationState {
    /** No contact. */
    INVALID = 0,
    /** The contact was released this frame. */
    RELEASED = 1,
    /** The contact started this frame. */
    PRESSED = 2,
    /** The contact moved while held. */
    MOVED = 3,
}
