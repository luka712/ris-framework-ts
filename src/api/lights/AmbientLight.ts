import {Color} from "../data/Color.ts";

/**
 * The ambient light. Plain data: it has no GPU resources.
 * Put it into a {@link LightsBuffer} to use it in shaders.
 * @public
 */
export class AmbientLight {

    /**
     * The constructor.
     * @param id The unique id of this light.
     * @param value The light colour. Alpha is ignored.
     * @param name The optional name.
     */
    public constructor(id: number, value: Color = Color.black(), name?: string) {
        this.id = id;
        this.value = value;
        this.name = name;
    }

    /** The unique id of this light. */
    public id: number;

    /** The optional name for a light. */
    public name?: string;

    /** The value of light. */
    public value: Color;
}
