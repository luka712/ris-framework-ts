import {PointerStateCollection} from "./PointerStateCollection";
import {TouchLocation} from "./TouchLocation";

/**
 * The touch locations for one frame.
 * A released contact stays in the collection for the frame it is released.
 */
export class TouchCollection {

    /**
     * The constructor.
     * @param _touches The touch locations.
     */
    public constructor(private readonly _touches: TouchLocation[]) {
    }

    /** Gets the list of touch locations. */
    public get touches(): TouchLocation[] {
        return this._touches;
    }

    /** The number of touch locations in this frame. */
    public get count(): number {
        return this._touches.length;
    }

    /**
     * The number of touches that are down.
     * Pressed and moved contacts count. Released and invalid contacts do not.
     */
    public get activeCount(): number {
        let active = 0;
        for (const touch of this._touches) {
            if (touch.isDown) {
                active++;
            }
        }
        return active;
    }

    /**
     * Finds a touch by id.
     * @param id The touch id.
     * @returns The first matching touch location, or undefined when this frame has no contact with that id.
     */
    public findById(id: number): TouchLocation | undefined {
        for (const touch of this._touches) {
            if (touch.id === id) {
                return touch;
            }
        }
        return undefined;
    }

    /**
     * True when the contact with this id is down.
     * A missing id is not down.
     * @param id The touch id.
     */
    public isDown(id: number): boolean {
        return this.findById(id)?.isDown ?? false;
    }

    /**
     * True when the contact with this id was released this frame.
     * A missing id was not released.
     * @param id The touch id.
     */
    public isReleased(id: number): boolean {
        return this.findById(id)?.isReleased() ?? false;
    }

    /**
     * Touch locations taken from a pointer collection.
     * Only touch locations are included, and the same instances are kept.
     * Mouse, pen, and a plain pointer marked as touch are left out: they have no press, move, release, or pressure.
     * @param pointers The pointer states.
     */
    public static fromPointerStates(pointers: PointerStateCollection): TouchCollection {
        const touches: TouchLocation[] = [];
        for (const state of pointers.pointerStates) {
            if (state instanceof TouchLocation) {
                touches.push(state);
            }
        }
        return new TouchCollection(touches);
    }
}
