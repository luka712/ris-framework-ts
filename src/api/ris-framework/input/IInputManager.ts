import {KeyboardState} from "./KeyboardState";
import {MouseState} from "./MouseState";
import {GamePadState} from "./GamePadState";

/**
 * The input manager.
 */
export interface IInputManager {

    /**
     * Gets or sets the thumbstick dead zone.
     * The dead zone is a range of values near the center of the thumbstick that are ignored.
     * By default, it is 0.25f.
     */
    thumbstickDeadZone: number;

    /**
     * Gets the . Can be used to query pressed keys.
     * @returns The .
     */
    getKeyboardState(): KeyboardState;

    /**
     * Gets the . Can be used to query pressed keys.
     * @returns The .
     */
    getMouseState(): MouseState;

    /**
     * Gets the . Can be used to query pressed buttons.
     * @param gamePadIndex - The index of a gamepad. By default, it is 0 for first.
     * @returns The .
     */
    getGamePadState(gamePadIndex: number): GamePadState;

    /**
     * Initialize the input manager.
     */
    initialize(): void;

    /**
     * Update the input manager.
     */
    update(): void;

    /**
     * Call this after update. Usually at the end of update loop in order to clear.
     */
    afterUpdate(): void;
}
