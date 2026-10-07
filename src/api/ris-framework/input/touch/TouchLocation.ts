import {vec2} from "gl-matrix";
import {TouchLocationState} from "./TouchLocationState.ts";

/**
 * A single touch contact.
 * Position, delta, and the previous sample are stored on this object.
 * Reading them again returns those same instances.
 */
export class TouchLocation {

    /** The touch id. Stable for the lifetime of the contact. */
    public id = 0;

    /** The pressure, from 0 to 1. 0 when the device does not report pressure. */
    public pressure = 0;

    /**
     * The position of the touch.
     * Viewport coordinates in CSS pixels, the same space as MouseState (clientX, clientY).
     */
    public readonly position: vec2 = vec2.create();

    /**
     * The delta from the previous sample. Zero when this frame has no previous sample.
     * Viewport coordinates in CSS pixels, the same space as MouseState delta.
     */
    public readonly delta: vec2 = vec2.create();

    /**
     * True when the contact is pressed or moved.
     * Updated when state is written.
     */
    public isDown = false;

    private _state = TouchLocationState.INVALID;
    private _hasPrevious = false;
    private readonly _previous: TouchLocation | undefined;

    /**
     * The constructor.
     * @param ownsPrevious True when this location keeps a previous sample. The previous sample does not keep one of its own.
     */
    public constructor(ownsPrevious = true) {
        if (ownsPrevious) {
            this._previous = new TouchLocation(false);
        } else {
            this._previous = undefined;
        }
    }

    /** The touch location state. */
    public get state(): TouchLocationState {
        return this._state;
    }

    /** The touch location state. */
    public set state(value: TouchLocationState) {
        this._state = value;
        this.isDown = value === TouchLocationState.PRESSED
            || value === TouchLocationState.MOVED;
    }

    /** The x position. */
    public get x(): number {
        return this.position[0];
    }

    /** The y position. */
    public get y(): number {
        return this.position[1];
    }

    /** The delta x. */
    public get dX(): number {
        return this.delta[0];
    }

    /** The delta y. */
    public get dY(): number {
        return this.delta[1];
    }

    /** True when the contact started this frame. */
    public isPressed(): boolean {
        return this._state === TouchLocationState.PRESSED;
    }

    /** True when the contact moved while held. */
    public isMoved(): boolean {
        return this._state === TouchLocationState.MOVED;
    }

    /** True when the contact was released this frame. */
    public isReleased(): boolean {
        return this._state === TouchLocationState.RELEASED;
    }

    /** True when the contact was cancelled this frame. A cancel is not a finger lift. */
    public isCancelled(): boolean {
        return this._state === TouchLocationState.CANCELLED;
    }

    /**
     * The previous sample of this contact.
     * Undefined when this is the first sample. The same instance is returned for every call in the frame.
     */
    public tryGetPreviousLocation(): TouchLocation | undefined {
        if (!this._hasPrevious) {
            return undefined;
        }
        return this._previous;
    }

    /**
     * Writes this sample.
     * Clears the previous sample and sets delta to zero.
     * @param id The touch id.
     * @param state The touch location state.
     * @param x The x position.
     * @param y The y position.
     * @param pressure The pressure.
     */
    public write(id: number,
                 state: TouchLocationState,
                 x: number,
                 y: number,
                 pressure: number): void {
        this.id = id;
        this.state = state;
        this.position[0] = x;
        this.position[1] = y;
        this.pressure = pressure;
        this._hasPrevious = false;
        this.delta[0] = 0;
        this.delta[1] = 0;
    }

    /**
     * Writes the previous sample and caches delta as this position minus that position.
     * @param state The previous touch location state.
     * @param x The previous x position.
     * @param y The previous y position.
     * @param pressure The previous pressure.
     */
    public writePrevious(state: TouchLocationState,
                         x: number,
                         y: number,
                         pressure: number): void {
        const previous = this._previous;
        if (previous === undefined) {
            return;
        }

        previous.write(this.id, state, x, y, pressure);
        this._hasPrevious = true;
        this.delta[0] = this.position[0] - x;
        this.delta[1] = this.position[1] - y;
    }
}
