import type {vec3} from "gl-matrix";
import type {Color} from "../data/Color.ts";

/**
 * The directional light.
 * @public
 */
export interface DirectionalLight {

    /** The unique id of this light. */
    id: number;

    /** The optional name for a light. */
    name?: string;

    /** The value of light. */
    value: Color;

    /** Direction in which this lights casts light. */
    direction: vec3;
}