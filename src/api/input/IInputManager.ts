import {KeyboardState} from "./KeyboardState.ts";
import {MouseState} from "./mouse/MouseState.ts";
import {GamePadState} from "./gamepad/GamePadState.ts";
import {TouchCollection} from "./touch/TouchCollection.ts";
import {TouchPanelCapabilities} from "./touch/TouchPanelCapabilities.ts";

/**
 * The input manager.
 */
export interface IInputManager {

    /**
     * Gets or sets the thumbstick dead zone.
     * The dead zone is a range of values near the center of the thumbstick that are ignored.
     * By default, it is 0.2.
     */
    thumbstickDeadZone: number;

    /**
     * Gets the keyboard state. Can be used to query pressed keys.
     * @returns The keyboard state.
     */
    getKeyboardState(): KeyboardState;

    /**
     * Gets the mouse state. Can be used to query pressed buttons and the cursor position.
     * @returns The mouse state.
     */
    getMouseState(): MouseState;

    /**
     * Gets the gamepad state. Can be used to query pressed buttons.
     * @param gamePadIndex - The index of a gamepad. By default, it is 0 for first.
     * @returns The gamepad state.
     */
    getGamePadState(gamePadIndex: number): GamePadState;

    /**
     * Gets the touch locations for the current frame.
     */
    getTouchCollection(): TouchCollection;

    /**
     * Gets the capabilities of the touch panel.
     */
    getTouchCapabilities(): TouchPanelCapabilities;

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
