import {TouchLocation} from "./TouchLocation";
import {TouchLocationState} from "./TouchLocationState";

/**
 * The touch locations for one frame.
 * Slots are allocated once. clear and tryAdd reuse them, and reads do not allocate.
 */
export class TouchCollection {

    /** Default number of simultaneous touches the collection stores. */
    public static readonly MAX_TOUCH_COUNT = 8;

    /** The fixed number of slots in this collection. */
    public readonly maxTouchCount: number;

    private readonly _locations: TouchLocation[];
    private _count = 0;
    private _activeCount = 0;

    /**
     * The constructor.
     * @param maxTouchCount The fixed slot count. Values below 1 store no touches. The default is MAX_TOUCH_COUNT.
     */
    public constructor(maxTouchCount = TouchCollection.MAX_TOUCH_COUNT) {
        const capacity = maxTouchCount > 0 ? Math.floor(maxTouchCount) : 0;
        this.maxTouchCount = capacity;
        const locations = new Array<TouchLocation>(capacity);
        for (let i = 0; i < capacity; i++) {
            locations[i] = new TouchLocation();
        }
        this._locations = locations;
    }

    /** The number of touch locations written this frame, including releases. */
    public get count(): number {
        return this._count;
    }

    /**
     * The number of touches that were down when they were written.
     * Pressed and moved contacts count. Released and invalid contacts do not.
     * This is stored while contacts are written, not counted again on read.
     */
    public get activeCount(): number {
        return this._activeCount;
    }

    /**
     * Drops the frame's contacts.
     * Slots stay allocated. The next tryAdd reuses them from the start.
     */
    public clear(): void {
        this._count = 0;
        this._activeCount = 0;
    }

    /**
     * Writes the next contact into the next free slot.
     * @param id The touch id.
     * @param state The touch location state.
     * @param x The x position.
     * @param y The y position.
     * @param pressure The pressure.
     * @param previousState The previous state. Omit it when this is the first sample.
     * @param previousX The previous x position.
     * @param previousY The previous y position.
     * @param previousPressure The previous pressure.
     * @returns The slot that was written, or undefined when every slot is already used.
     */
    public tryAdd(id: number,
                  state: TouchLocationState,
                  x: number,
                  y: number,
                  pressure = 0,
                  previousState?: TouchLocationState,
                  previousX = 0,
                  previousY = 0,
                  previousPressure = 0): TouchLocation | undefined {
        if (this._count >= this._locations.length) {
            return undefined;
        }

        const location = this._locations[this._count];
        location.write(id, state, x, y, pressure);
        if (previousState !== undefined) {
            location.writePrevious(previousState, previousX, previousY, previousPressure);
        }

        this._count++;
        if (location.isDown) {
            this._activeCount++;
        }
        return location;
    }

    /**
     * The touch at an index in this frame.
     * @param index The index, from 0 to count - 1.
     * @returns The stored location, or undefined when the index is outside this frame.
     */
    public get(index: number): TouchLocation | undefined {
        if (index < 0 || index >= this._count) {
            return undefined;
        }
        return this._locations[index];
    }

    /**
     * Finds a touch by id.
     * Scans only the contacts written this frame. The first match wins.
     * @param id The touch id.
     * @returns The stored location, or undefined when this frame has no contact with that id.
     */
    public findById(id: number): TouchLocation | undefined {
        const count = this._count;
        const locations = this._locations;
        for (let i = 0; i < count; i++) {
            const location = locations[i];
            if (location.id === id) {
                return location;
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
        const location = this.findById(id);
        if (location === undefined) {
            return false;
        }
        return location.isDown;
    }

    /**
     * True when the contact with this id was released this frame.
     * A missing id was not released.
     * @param id The touch id.
     */
    public isReleased(id: number): boolean {
        const location = this.findById(id);
        if (location === undefined) {
            return false;
        }
        return location.isReleased();
    }
}
