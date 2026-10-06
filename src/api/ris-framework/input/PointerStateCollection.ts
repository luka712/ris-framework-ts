import {PointerState} from "./PointerState";

/** The pointer states. */
export class PointerStateCollection {


    /**
     * The constructor.
     * @param _pointerStates The pointer states.
     */
    public constructor(
        private readonly _pointerStates: PointerState[], ) {
    }

    /** Gets the list of pointer states. */
    public get pointerStates(): PointerState[] {
        return this._pointerStates;
    }

    /** Get the count of currently active pointer events */
    public get count() {
        return this._pointerStates.length;
    }
}
