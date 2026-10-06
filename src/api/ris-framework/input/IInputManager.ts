import {KeyboardState} from "./KeyboardState";
import {MouseState} from "./MouseState";
import {GamePadState} from "./GamePadState";
import {PointerStateCollection} from "./PointerStateCollection";
import {TouchCollection} from "./TouchCollection";
import {TouchPanelCapabilities} from "./TouchPanelCapabilities";
import {GestureType} from "./GestureType";
import {GestureCollection} from "./GestureCollection";

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
     * Gestures the touch panel should recognize.
     * Combine GestureType values. By default, it is GestureType.NONE.
     */
    enabledGestures: GestureType;

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
     * Gets the collection of all pointer states.
     * Pointer is any mouse, touch or pen event.
     */
    getPointerStates() : PointerStateCollection;

    /**
     * Gets the touch locations for the current frame.
     * A touch location is the pointer contact for a finger, with press, move, release, and pressure.
     */
    getTouchCollection(): TouchCollection;

    /**
     * Gets the capabilities of the touch panel.
     */
    getTouchCapabilities(): TouchPanelCapabilities;

    /**
     * Gets the gestures recognized for the current frame.
     */
    getGestures(): GestureCollection;

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
