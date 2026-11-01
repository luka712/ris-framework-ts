import {Color} from "../data/Color.ts";
import {createLightId} from "./LightId.ts";
import type {Scene} from "../scene/Scene.ts";

/** The descriptor for an ambient light. All fields are optional. */
export interface AmbientLightDescriptor {
    /** The unique id. Assigned automatically when omitted. */
    id?: number;

    /** The optional name for a light. */
    name?: string;

    /** The light colour. Alpha is ignored. Defaults to black. */
    color?: Color;

    /** Multiplies the colour. Defaults to 1. */
    intensity?: number;
}

/**
 * The ambient light. Plain data: it has no GPU resources.
 * Put it into a {@link LightsBuffer} to use it in shaders.
 * @public
 */
export class AmbientLight {

    /**
     * The constructor.
     * @param descriptor The optional descriptor. The colour is copied.
     * @param scene The optional scene to register with.
     */
    public constructor(descriptor?: AmbientLightDescriptor, scene?: Scene) {

        this.id = descriptor?.id ?? createLightId();
        this.name = descriptor?.name;
        this.color = descriptor?.color?.copy() ?? Color.black();
        this.intensity = descriptor?.intensity ?? 1;

        scene?.add(this);
    }

    /** The unique id of this light. */
    public readonly id: number;

    /** The optional name for a light. */
    public name?: string;

    /** The light color. Alpha is ignored. */
    public color: Color;

    /** Multiplies {@link color} when written to the lights buffer. */
    public intensity: number;
}
