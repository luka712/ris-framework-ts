import {
    GamePadState,
    type IFramework,
    type IInputManager,
    KeyboardState,
    MouseButton,
    MouseState
} from "ris-framework-api";
import {vec2} from "gl-matrix";

export class InputManager implements IInputManager {

    private readonly _mouseButtonMap: { [key: number]: MouseButton } = {
        0: MouseButton.LEFT,
        1: MouseButton.MIDDLE,
        2: MouseButton.RIGHT,
    }

    private readonly _mouseState: MouseState;
    private readonly _mousePosition = vec2.create();
    private readonly _previousMousePosition = vec2.create();
    private readonly _mouseDelta = vec2.create();
    private readonly _scrollWheelPosition = vec2.create();
    private readonly _mouseButtonDown: { [key: number]: boolean } = {};
    private readonly _mouseButtonReleased: { [key: number]: boolean } = {};

    /** TODO */
    public constructor(private readonly _framework: IFramework) {

        this._mouseState = new MouseState(
            this._mouseButtonDown, this._mouseButtonReleased,
            this._mousePosition, this._mouseDelta, this._scrollWheelPosition
        );
    }


    thumbstickDeadZone = 0.2;


    getGamePadState(_gamePadIndex: number): GamePadState {
        return new GamePadState(false, {}, {}, vec2.create(), vec2.create());
    }

    getKeyboardState(): KeyboardState {
        return new KeyboardState({}, {});
    }

    /** @inheritDoc */
    public getMouseState(): MouseState {
        return this._mouseState;
    }

    /** @inheritDoc */
    public initialize(): void {

        const canvas = this._framework.windowManager.canvas;
        this._handleMouseEvents(canvas)
    }

    private _handleMouseEvents(canvas: HTMLCanvasElement) {

        canvas.addEventListener("mousemove", (e: MouseEvent) => {
            this._mousePosition[0] = e.clientX;
            this._mousePosition[1] = e.clientY;
        });

        canvas.addEventListener("mousedown", (e: MouseEvent) => {
            const idx = e.button;
            const btn = this._mouseButtonMap[idx] ?? MouseButton.NONE;
            this._mouseButtonDown[btn] = true;
        })

        canvas.addEventListener("mouseup", (e: MouseEvent) => {
            const idx = e.button;
            const btn = this._mouseButtonMap[idx] ?? MouseButton.NONE;
            this._mouseButtonDown[btn] = false;
            this._mouseButtonReleased[btn] = true;
        });

        canvas.addEventListener("wheel", (e: WheelEvent) => {

            let x = 0;
            let y = 0;
            if (e.deltaX > 0) {
                x = 1;
            } else if (e.deltaX < 0) {
                x = -1;
            }

            if (e.deltaY > 0) {
                y = 1;
            } else if (e.deltaY < 0) {
                y = -1;
            }

            vec2.set(this._scrollWheelPosition, x, y);

            e.preventDefault();
        })
    }

    /** @inheritDoc */
    public update(): void {
        vec2.sub(this._mouseDelta, this._mousePosition, this._previousMousePosition);
        vec2.copy(this._previousMousePosition, this._mousePosition);
    }

    /** @inheritDoc */
    public afterUpdate(): void {
        vec2.set(this._scrollWheelPosition, 0, 0);

    }


}