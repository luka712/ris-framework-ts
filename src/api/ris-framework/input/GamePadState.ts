import {GamePadThumbSticks} from "./GamePadThumbSticks";
import {vec2} from "gl-matrix";
import {Button} from "./Button";

/**
 * The state of the gamepad.
 */
export class GamePadState {
    private readonly _thumbSticks: GamePadThumbSticks;

    /**
     * The constructor.
     * @param isConnected - Set to true if gamepad is connected.
     * @param downButtons - The down buttons.
     * @param releasedButtons - The released buttons.
     * @param leftThumbstick - The left thumbstick position.
     * @param rightThumbstick - The right thumbstick position.
     */
    public constructor(
        public readonly isConnected: boolean,
        private readonly _downButtons: { [key: number]: boolean },
        private readonly _releasedButtons: { [key: number]: boolean },
        leftThumbstick: vec2,
        rightThumbstick: vec2
    ) {
        this._thumbSticks = new GamePadThumbSticks(
            leftThumbstick,
            rightThumbstick
        );
    }

    /**
     * The thumbstick positions.
     */
    public get thumbSticks(): GamePadThumbSticks {
        return this._thumbSticks;
    }

    /**
     * Check if the button is down.
     * @param button - The button to check.
     * @returns true if button is down, false otherwise.
     */
    public isButtonDown(button: Button): boolean {
        return this._downButtons[button] ?? false;
    }

    /**
     * Check if the button is up.
     * @param button - The button to check.
     * @returns true if button is up, false otherwise.
     */
    public isButtonUp(button: Button): boolean {
        return !this.isButtonDown(button);
    }

    /**
     * Check if the button is released in current frame.
     * @param button - The button to check.
     * @returns true if button is released.
     */
    public isButtonReleased(button: Button): boolean {
        return this._releasedButtons[button] ?? false;
    }
}