import {
    GamePadState,
    type IFramework,
    type IInputManager,
    KeyboardState,
    MouseButton,
    MouseState,
    TouchCollection,
    TouchLocationState,
    TouchPanelCapabilities,
} from "../index.ts";
import {vec2} from "gl-matrix";

/**
 * One finger.
 * Allocated with the pool and reset when the finger is gone.
 */
class TouchContact {

    public id = 0;
    public inUse = false;
    public state = TouchLocationState.INVALID;
    public x = 0;
    public y = 0;
    public pressure = 0;
    public hasPrevious = false;
    /** Previous was captured for this frame. Later events must not overwrite it. */
    public hasFramePrevious = false;
    public prevState = TouchLocationState.INVALID;
    public prevX = 0;
    public prevY = 0;
    public prevPressure = 0;
    /** Pressed and released before the press was published. The press is shown first. */
    public sameFrameReleased = false;

    public releaseSlot(): void {
        this.inUse = false;
        this.state = TouchLocationState.INVALID;
        this.hasPrevious = false;
        this.hasFramePrevious = false;
        this.sameFrameReleased = false;
        this.pressure = 0;
    }
}

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

    private readonly _touchCollection: TouchCollection;
    private readonly _touchCapabilities: TouchPanelCapabilities;
    private readonly _contacts: TouchContact[];
    private _touchListening = false;
    /** Set in update, consumed in afterUpdate. Ageing before a publish would hide the press. */
    private _touchPublished = false;

    private static readonly _PHASE_BEGIN = 0;
    private static readonly _PHASE_MOVE = 1;
    private static readonly _PHASE_END = 2;
    private static readonly _PHASE_CANCEL = 3;
    private static readonly _touchListenerOptions: AddEventListenerOptions = {passive: false};

    /**
     * The constructor.
     * @param _framework The framework. Its window manager canvas receives the input listeners in initialize().
     */
    public constructor(private readonly _framework: IFramework) {

        this._mouseState = new MouseState(
            this._mouseButtonDown, this._mouseButtonReleased,
            this._mousePosition, this._mouseDelta, this._scrollWheelPosition
        );

        const capacity = TouchCollection.MAX_TOUCH_COUNT;
        const contacts = new Array<TouchContact>(capacity);
        for (let i = 0; i < capacity; i++) {
            contacts[i] = new TouchContact();
        }
        this._contacts = contacts;
        this._touchCollection = new TouchCollection(capacity);
        this._touchCapabilities = this._createTouchCapabilities();
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
    public getTouchCollection(): TouchCollection {
        return this._touchCollection;
    }

    /** @inheritDoc */
    public getTouchCapabilities(): TouchPanelCapabilities {
        return this._touchCapabilities;
    }

    /** @inheritDoc */
    public initialize(): void {

        const canvas = this._framework.windowManager.canvas;
        this._handleMouseEvents(canvas);
        this._handleTouchEvents(canvas);
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

    private _handleTouchEvents(canvas: HTMLCanvasElement): void {
        if (this._touchListening) {
            return;
        }
        this._touchListening = true;

        // Pan and pinch-zoom start on this canvas only. The rest of the page is left alone.
        canvas.style.touchAction = "none";

        const options = InputManager._touchListenerOptions;
        canvas.addEventListener("touchstart", this._onTouchStart, options);
        canvas.addEventListener("touchmove", this._onTouchMove, options);
        canvas.addEventListener("touchend", this._onTouchEnd, options);
        canvas.addEventListener("touchcancel", this._onTouchCancel, options);
    }

    private readonly _onTouchStart = (event: TouchEvent): void => {
        this._readTouches(event, InputManager._PHASE_BEGIN);
        this._blockBrowserTouchGesture(event);
    };

    private readonly _onTouchMove = (event: TouchEvent): void => {
        this._readTouches(event, InputManager._PHASE_MOVE);
        this._blockBrowserTouchGesture(event);
    };

    private readonly _onTouchEnd = (event: TouchEvent): void => {
        this._readTouches(event, InputManager._PHASE_END);
    };

    private readonly _onTouchCancel = (event: TouchEvent): void => {
        this._readTouches(event, InputManager._PHASE_CANCEL);
    };

    private _blockBrowserTouchGesture(event: TouchEvent): void {
        if (event.cancelable) {
            event.preventDefault();
        }
    }

    private _readTouches(event: TouchEvent, phase: number): void {
        const changed = event.changedTouches;
        const length = changed.length;
        for (let i = 0; i < length; i++) {
            const touch = changed.item(i);
            if (touch === null) {
                continue;
            }
            if (phase === InputManager._PHASE_BEGIN) {
                this._beginTouch(touch);
            } else if (phase === InputManager._PHASE_MOVE) {
                this._moveTouch(touch);
            } else if (phase === InputManager._PHASE_CANCEL) {
                this._cancelTouch(touch);
            } else {
                this._endTouch(touch);
            }
        }

        this._noteTouchDevice(event);
    }

    private _beginTouch(touch: Touch): void {
        if (this._findContact(touch.identifier) !== undefined) {
            return;
        }

        const contact = this._acquireContact(touch.identifier);
        if (contact === undefined) {
            return;
        }

        contact.state = TouchLocationState.PRESSED;
        contact.x = touch.clientX;
        contact.y = touch.clientY;
        contact.pressure = this._readPressure(touch);
        contact.hasPrevious = false;
        contact.hasFramePrevious = false;
        contact.sameFrameReleased = false;
    }

    private _moveTouch(touch: Touch): void {
        const contact = this._findContact(touch.identifier);
        if (contact === undefined || this._isTerminal(contact)) {
            return;
        }

        const x = touch.clientX;
        const y = touch.clientY;
        if (!contact.hasFramePrevious && (x !== contact.x || y !== contact.y)) {
            this._rememberCurrentAsPrevious(contact);
        }
        contact.x = x;
        contact.y = y;
        contact.pressure = this._readPressure(touch);
    }

    private _endTouch(touch: Touch): void {
        const contact = this._findContact(touch.identifier);
        if (contact === undefined || this._isTerminal(contact)) {
            return;
        }

        // A press that also ends before update stays pressed for that read, then ages to released.
        const pressedThisFrame = contact.state === TouchLocationState.PRESSED;
        if (!contact.hasFramePrevious) {
            this._rememberCurrentAsPrevious(contact);
        }
        contact.x = touch.clientX;
        contact.y = touch.clientY;
        // touchend usually reports force 0. Keep the last real reading.
        const pressure = this._readPressure(touch);
        if (pressure > 0) {
            contact.pressure = pressure;
        }
        if (pressedThisFrame) {
            contact.sameFrameReleased = true;
            return;
        }
        contact.state = TouchLocationState.RELEASED;
    }

    private _cancelTouch(touch: Touch): void {
        const contact = this._findContact(touch.identifier);
        if (contact === undefined || contact.state === TouchLocationState.CANCELLED) {
            return;
        }

        // A system cancel is not a finger lift, including when the press has not been published yet.
        if (!contact.hasFramePrevious) {
            this._rememberCurrentAsPrevious(contact);
        }
        contact.x = touch.clientX;
        contact.y = touch.clientY;
        const pressure = this._readPressure(touch);
        if (pressure > 0) {
            contact.pressure = pressure;
        }
        contact.sameFrameReleased = false;
        contact.state = TouchLocationState.CANCELLED;
    }

    private _isTerminal(contact: TouchContact): boolean {
        return contact.state === TouchLocationState.RELEASED
            || contact.state === TouchLocationState.CANCELLED;
    }

    private _rememberCurrentAsPrevious(contact: TouchContact): void {
        contact.prevState = contact.state;
        contact.prevX = contact.x;
        contact.prevY = contact.y;
        contact.prevPressure = contact.pressure;
        contact.hasPrevious = true;
        contact.hasFramePrevious = true;
    }

    private _findContact(id: number): TouchContact | undefined {
        const contacts = this._contacts;
        const length = contacts.length;
        for (let i = 0; i < length; i++) {
            const contact = contacts[i];
            if (contact.inUse && contact.id === id) {
                return contact;
            }
        }
        return undefined;
    }

    private _acquireContact(id: number): TouchContact | undefined {
        const contacts = this._contacts;
        const length = contacts.length;
        for (let i = 0; i < length; i++) {
            const contact = contacts[i];
            if (!contact.inUse) {
                contact.inUse = true;
                contact.id = id;
                return contact;
            }
        }
        return undefined;
    }

    private _readPressure(touch: Touch): number {
        const force = touch.force;
        if (!(force > 0)) {
            return 0;
        }
        if (force > 1) {
            return 1;
        }
        return force;
    }

    private _createTouchCapabilities(): TouchPanelCapabilities {
        const reported = navigator.maxTouchPoints;
        const maximumTouchCount = reported > 0 ? reported : 0;
        const hasPressure = maximumTouchCount > 0
            && typeof Touch !== "undefined"
            && "force" in Touch.prototype;
        return new TouchPanelCapabilities(maximumTouchCount > 0, maximumTouchCount, hasPressure);
    }

    /**
     * A touch event means a device is connected, even when maxTouchPoints is 0.
     * Writes into the existing capabilities instance.
     */
    private _noteTouchDevice(event: TouchEvent): void {
        const changed = event.changedTouches;
        const liveCount = event.touches.length;
        if (changed.length === 0 && liveCount === 0) {
            return;
        }

        const capabilities = this._touchCapabilities;
        let maximumTouchCount = capabilities.maximumTouchCount;
        if (liveCount > maximumTouchCount) {
            maximumTouchCount = liveCount;
        }
        if (maximumTouchCount < 1 && changed.length > maximumTouchCount) {
            maximumTouchCount = changed.length;
        }

        let hasPressure = capabilities.hasPressure;
        if (!hasPressure) {
            const length = changed.length;
            for (let i = 0; i < length; i++) {
                const touch = changed.item(i);
                if (touch !== null && touch.force > 0) {
                    hasPressure = true;
                    break;
                }
            }
        }

        if (capabilities.isConnected
            && capabilities.maximumTouchCount === maximumTouchCount
            && capabilities.hasPressure === hasPressure) {
            return;
        }

        capabilities.set(true, maximumTouchCount, hasPressure);
    }

    private _publishTouches(): void {
        const collection = this._touchCollection;
        collection.clear();

        const contacts = this._contacts;
        const length = contacts.length;
        for (let i = 0; i < length; i++) {
            const contact = contacts[i];
            if (!contact.inUse || contact.state === TouchLocationState.INVALID) {
                continue;
            }

            if (contact.hasPrevious) {
                collection.tryAdd(
                    contact.id,
                    contact.state,
                    contact.x,
                    contact.y,
                    contact.pressure,
                    contact.prevState,
                    contact.prevX,
                    contact.prevY,
                    contact.prevPressure
                );
            } else {
                collection.tryAdd(
                    contact.id,
                    contact.state,
                    contact.x,
                    contact.y,
                    contact.pressure
                );
            }
        }
    }

    /**
     * Pressed becomes moved, and a same-frame release becomes released, after the frame has read them.
     * Released and cancelled contacts leave the pool so the next publish does not report them again.
     */
    private _ageTouches(): void {
        const contacts = this._contacts;
        const length = contacts.length;
        for (let i = 0; i < length; i++) {
            const contact = contacts[i];
            if (!contact.inUse) {
                continue;
            }

            if (contact.state === TouchLocationState.RELEASED
                || contact.state === TouchLocationState.CANCELLED) {
                contact.releaseSlot();
                continue;
            }

            contact.prevState = contact.state;
            contact.prevX = contact.x;
            contact.prevY = contact.y;
            contact.prevPressure = contact.pressure;
            contact.hasPrevious = true;
            contact.hasFramePrevious = true;

            if (contact.state === TouchLocationState.PRESSED) {
                contact.state = contact.sameFrameReleased
                    ? TouchLocationState.RELEASED
                    : TouchLocationState.MOVED;
            }
            contact.sameFrameReleased = false;
        }
    }

    /** @inheritDoc */
    public update(): void {
        vec2.sub(this._mouseDelta, this._mousePosition, this._previousMousePosition);
        vec2.copy(this._previousMousePosition, this._mousePosition);
        this._publishTouches();
        this._touchPublished = true;
    }

    /** @inheritDoc */
    public afterUpdate(): void {
        vec2.set(this._scrollWheelPosition, 0, 0);

        // Released is a one-frame state. Without this reset, isButtonReleased stays true forever.
        const released = this._mouseButtonReleased;
        for (const button in released) {
            released[button] = false;
        }

        if (!this._touchPublished) {
            return;
        }
        this._ageTouches();
        this._touchPublished = false;
    }


}
