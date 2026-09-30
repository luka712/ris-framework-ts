import {MouseButton} from "./MouseButton";
import {vec2} from "gl-matrix";

/**
 * The mouse state.
 */
export class MouseState {

    /**
     * The constructor.
     * TODO: doc comments
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
     * Returns true if  is down in current frame.
     * @param button - The .
     * @returns True if  is down.
     */
    public isButtonDown(button: MouseButton): boolean {
        return this._downButtons[button];
    }

    /**
     * Returns true if  is up in current frame.
     * @param button - The .
     * @returns True if  is up.
     */
    public isButtonUp(button: MouseButton): boolean {
        return !this.isButtonDown(button);
    }

    /**
     * Checks if  is released in current frame.
     * @param button - The .
     * @returns True if  is released in current frame.
     */
    public isButtonReleased(button: MouseButton): boolean {
        return this._releasedButtons[button];
    }
}
