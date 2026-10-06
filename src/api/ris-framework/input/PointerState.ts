import {vec2} from "gl-matrix";
import {PointerType} from "./PointerType";

export class PointerState {

    /**
     * The constructor.
     * @param pointerId The id of a pointer.
     * @param pointerType The pointer type.
     * @param position The position of a pointer.
     * @param delta The delta value of a pointer.
     */
    constructor(public readonly pointerId: number,
                public readonly pointerType: PointerType,
                public readonly position: vec2,
                public readonly delta: vec2
                ) {
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
     * Indicates if pointer is down.
     * This should never be set manually.
     */
    public isDown = false;
}