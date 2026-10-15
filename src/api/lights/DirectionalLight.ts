import {vec3} from "gl-matrix";
import {Color} from "../data/Color.ts";
import {createLightId} from "./LightId.ts";
import type {Scene} from "../scene/Scene.ts";

/** The descriptor for a directional light. All fields are optional. */
export interface DirectionalLightDescriptor {
    /** The unique id. Assigned automatically when omitted. */
    id?: number;

    /** The optional name for a light. */
    name?: string;

    /** The light colour. Alpha is ignored. Defaults to white. */
    color?: Color;

    /** Multiplies the colour. Defaults to 1. */
    intensity?: number;

    /** The direction in which the light travels. Defaults to straight down, (0, -1, 0). */
    direction?: vec3;
}

/**
 * The directional light. Plain data: it has no GPU resources.
 * @public
 */
export class DirectionalLight {

    /**
     * The constructor.
     * @param descriptor The optional descriptor. Colour and direction are copied.
     * @param scene The optional scene; the light adds itself via {@link Scene.add}.
     * @throws Error when the scene has no free directional light slot left (the light is then not in the scene).
     */
    public constructor(descriptor?: DirectionalLightDescriptor, scene?: Scene) {
        this.id = descriptor?.id ?? createLightId();
        this.name = descriptor?.name;
        this.color = descriptor?.color?.copy() ?? Color.white();
        this.intensity = descriptor?.intensity ?? 1;
        this.direction = descriptor?.direction ? vec3.clone(descriptor.direction) : vec3.fromValues(0, -1, 0);

        scene?.add(this);
    }

    /** The unique id of this light. */
    public readonly id: number;

    /** The optional name for a light. */
    public name?: string;

    /** The light colour. Alpha is ignored. */
    public color: Color;

    /** Multiplies {@link color} when written to the lights buffer. */
    public intensity: number;

    /** The direction in which the light travels. */
    public direction: vec3;
}
