/**
 * Gestures the touch panel can recognize.
 * Values can be combined.
 */
export enum GestureType {
    NONE = 0,
    TAP = 1,
    DOUBLE_TAP = 2,
    HOLD = 4,
    HORIZONTAL_DRAG = 8,
    VERTICAL_DRAG = 16,
    FREE_DRAG = 32,
    PINCH = 64,
    FLICK = 128,
    PINCH_COMPLETE = 256,
    DRAG_COMPLETE = 512,
}
