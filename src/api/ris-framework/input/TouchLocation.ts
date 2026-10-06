import {vec2} from "gl-matrix";
import {PointerState} from "./PointerState";
import {PointerType} from "./PointerType";
import {TouchLocationState} from "./TouchLocationState";

/**
 * A single touch contact.
 * A touch is a pointer of type touch, so id, position, and delta live on the pointer state.
 * This adds the press, move, and release state, the pressure, and the previous sample of the same contact.
 */
export class TouchLocation extends PointerState {

    /**
     * The constructor.
     * @param id The touch id. Stable for the lifetime of the contact.
     * @param state The touch location state.
     * @param position The position of the touch.
     * @param delta The delta value of the touch.
     * @param pressure The pressure, from 0 to 1. 0 when the device does not report pressure.
     * @param previous The previous sample of this contact, when it was already tracked.
     */
    public constructor(id: number,
                       public readonly state: TouchLocationState,
                       position: vec2,
                       delta: vec2,
                       public readonly pressure: number,
                       private readonly _previous?: TouchLocation) {
        super(id, PointerType.TOUCH, position, delta);
        this.isDown = TouchLocation.isContactDown(state);
    }

    /**
     * The id of the touch.
     * Same value as pointerId.
     */
    public get id(): number {
        return this.pointerId;
    }

    /**
     * True when the contact started this frame.
     */
    public isPressed(): boolean {
        return this.state === TouchLocationState.PRESSED;
    }

    /**
     * True when the contact moved while held.
     */
    public isMoved(): boolean {
        return this.state === TouchLocationState.MOVED;
    }

    /**
     * True when the contact was released this frame.
     */
    public isReleased(): boolean {
        return this.state === TouchLocationState.RELEASED;
    }

    /**
     * The previous sample of this contact.
     * Undefined when this is the first sample.
     */
    public tryGetPreviousLocation(): TouchLocation | undefined {
        return this._previous;
    }

    /**
     * Pressed and moved contacts are down. Released and invalid contacts are not.
     */
    private static isContactDown(state: TouchLocationState): boolean {
        return state === TouchLocationState.PRESSED || state === TouchLocationState.MOVED;
    }
}
