import {Key} from "./Key";

/**
 * The keyboard state.
 */
export class KeyboardState {

    /**
     * The constructor.
     * @param downKeys - The keys that are down.
     * @param releasedKeys - The keys that are just released.
     */
    public constructor(private readonly _downKeys: { [key: number]: boolean },
                       private readonly _releasedKeys: { [key: number]: boolean }) {
    }

    /**
     * Returns true if key is down in current frame.
     * @param key - The .
     * @returns True if key is down.
     */
    public isKeyDown(key: Key): boolean {
        return this._downKeys[key];
    }

    /**
     * Returns true if key is up in current frame.
     * @param key - The .
     * @returns True if key is up.
     */
    public isKeyUp(key: Key): boolean {
        return !this.isKeyDown(key);
    }

    /**
     * The keys that was just released in current frame.
     * @param key - The .
     * @returns True if key is released in current frame.
     */
    public isKeyReleased(key: Key): boolean {
        return this._releasedKeys[key];
    }

}
