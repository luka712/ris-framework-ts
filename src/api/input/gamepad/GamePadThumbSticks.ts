import {vec2} from "gl-matrix";

/**
 * The thumbsticks of the gamepad.
 * @param left - The left thumbstick.
 * @param right - The right thumbstick.
 */
export class GamePadThumbSticks {

    /**
     * The thumbsticks of the gamepad.
     * @param left - The left thumbstick.
     * @param right - The right thumbstick.
     */
    public constructor(public left: vec2, public right: vec2) {
    }

}
