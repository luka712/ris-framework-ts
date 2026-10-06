import {vec2} from "gl-matrix";
import {GestureType} from "./GestureType";

/**
 * A gesture recognized from touch contacts.
 * Position and delta describe the primary contact.
 * Position2 and delta2 describe the second contact of a pinch.
 */
export class GestureSample {

    /**
     * The constructor.
     * @param gestureType The gesture type.
     * @param position The position of the primary contact.
     * @param delta The delta of the primary contact.
     * @param position2 The position of the second contact.
     * @param delta2 The delta of the second contact.
     */
    public constructor(public readonly gestureType: GestureType,
                       public readonly position: vec2,
                       public readonly delta: vec2,
                       public readonly position2: vec2,
                       public readonly delta2: vec2) {
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

    /** The second contact x position. */
    public get x2(): number {
        return this.position2[0];
    }

    /** The second contact y position. */
    public get y2(): number {
        return this.position2[1];
    }

    /** The second contact delta x. */
    public get dX2(): number {
        return this.delta2[0];
    }

    /** The second contact delta y. */
    public get dY2(): number {
        return this.delta2[1];
    }

    /**
     * True when the gesture uses two contacts.
     * Pinch and pinch-complete read position2 and delta2. Other gestures leave those vectors unused.
     */
    public get isMultiPoint(): boolean {
        return this.gestureType === GestureType.PINCH
            || this.gestureType === GestureType.PINCH_COMPLETE;
    }
}
