import type {Color} from "../data/Color.ts";
import type {ISceneObject} from "../scene/ISceneObject.ts";

/**
 * The common interface of all lights. A light is a scene object: its `transform` is the single source of truth
 * for where it is (point lights) or where it points (directional lights). The ambient light ignores its transform.
 * @public
 */
export interface ILight extends ISceneObject {

    /** The unique id of this light. */
    readonly id: number;

    /** The optional name for a light. */
    name?: string;

    /** The light colour. Alpha is ignored. */
    color: Color;

    /** Multiplies {@link color} when written to the lights buffer. */
    intensity: number;
}
