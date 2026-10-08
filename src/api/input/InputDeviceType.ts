
/** The type of input device. */
export enum InputDeviceType {

    /** No input. */
    NONE = 0,
    /** Keyboard */
    KEYBOARD = 1 << 0,
    /** Mouse */
    MOUSE = 1 << 1,
    /** Gamepad */
    GAMEPAD = 1 << 2,
    /** Touchpad */
    TOUCHPAD = 1 << 3,
    /** Pen */
    PEN = 1 << 4,

    /** Every input device */
    ALL = 0xFF_FF_FF_FF,
}