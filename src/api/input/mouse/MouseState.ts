import {MouseButton} from "./MouseButton.ts";
import {vec2} from "gl-matrix";

/**
 * The mouse state.
 */
export class MouseState {

    /**
     * The constructor. InputManager owns these objects and updates them in place.
     * @param _downButtons - The buttons that are down, keyed by MouseButton.
     * @param _releasedButtons - The buttons released this frame, keyed by MouseButton.
     * @param position - The cursor position in viewport (clientX / clientY) CSS pixels.
     * @param delta - The cursor movement since the previous frame.
     * @param scrollWheelPosition - The wheel direction this frame. Each axis is -1, 0, or 1.
     */
    public constructor(private readonly _downButtons: { [key: number]: boolean },
                       private readonly _releasedButtons: { [key: number]: boolean },
                       public position: vec2,
                       public delta: vec2,
                       public scrollWheelPosition: vec2) {
    }

    /** The x position. */
    public get x(): number {
        return this.position[0];
    }

    /** The y position. */
    public get y(): number {
        return this.position[1];
    }

    /** The delta x.*/
    public get dX(): number {
        return this.delta[0];
    }

    /** The delta y. */
    public get dY(): number {
        return this.delta[1];
    }

    /**
     * Returns true if MouseButton is down in current frame.
     * @param button - The button to check.
     * @returns True if button is down.
     */
    public isButtonDown(button: MouseButton): boolean {
        return this._downButtons[button];
    }

    /**
     * Returns true if the button is up in current frame.
     * @param button - The button to check.
     * @returns True if the button is up.
     */
    public isButtonUp(button: MouseButton): boolean {
        return !this.isButtonDown(button);
    }

    /**
     * Checks if the button is released in current frame.
     * @param button - The button to check.
     * @returns True if the button is released in current frame.
     */
    public isButtonReleased(button: MouseButton): boolean {
        return this._releasedButtons[button];
    }
}
