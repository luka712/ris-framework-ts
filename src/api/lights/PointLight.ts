import {vec3} from "gl-matrix";
import {Color} from "../data/Color.ts";
import {createLightId} from "./LightId.ts";
import type {Scene} from "../scene/Scene.ts";
import type {ILight} from "./ILight.ts";
import {TransformNode} from "../scene/node/TransformNode.ts";
import {CameraTransformUtilities} from "../camera/CameraTransformUtilities.ts";

/** The descriptor for a point light. All fields are optional. */
export interface PointLightDescriptor {
    /** The unique id. Assigned automatically when omitted. */
    id?: number;

    /** The optional name for a light. */
    name?: string;

    /** The light colour. Alpha is ignored. Defaults to white. */
    color?: Color;

    /** Multiplies the colour. Defaults to 1. */
    intensity?: number;

    /** The initial world position (see {@link PointLight.setPosition}). Defaults to the origin. */
    position?: vec3;

    /** Constant attenuation term. Defaults to 1. */
    constant?: number;

    /** Linear attenuation term. Defaults to 0.09 (about 50 units of range). */
    linear?: number;

    /** Quadratic attenuation term. Defaults to 0.032 (about 50 units of range). */
    quadratic?: number;
}

/**
 * The point light. Plain data: it has no GPU resources.
 * Its position is the world position of its {@link transform}.
 * Attenuation is `1 / (constant + linear * d + quadratic * d²)` for distance `d`.
 * @public
 */
export class PointLight implements ILight {

    /** The default constant attenuation. */
    public static readonly DEFAULT_CONSTANT = 1;

    /** The default linear attenuation. */
    public static readonly DEFAULT_LINEAR = 0.09;

    /** The default quadratic attenuation. */
    public static readonly DEFAULT_QUADRATIC = 0.032;

    /**
     * The constructor.
     * @param descriptor The optional descriptor. Colour and position are copied.
     * @param scene The optional scene; the light adds itself via {@link Scene.add}.
     * @throws Error when the scene has no free point light slot left (the light is then not in the scene).
     */
    public constructor(descriptor?: PointLightDescriptor, scene?: Scene) {
        this.id = descriptor?.id ?? createLightId();
        this.name = descriptor?.name;
        this.color = descriptor?.color?.copy() ?? Color.white();
        this.intensity = descriptor?.intensity ?? 1;
        vec3.copy(this.transform.position, descriptor?.position ?? [0, 0, 0]);
        this.constant = descriptor?.constant ?? PointLight.DEFAULT_CONSTANT;
        this.linear = descriptor?.linear ?? PointLight.DEFAULT_LINEAR;
        this.quadratic = descriptor?.quadratic ?? PointLight.DEFAULT_QUADRATIC;

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

    /** The transform. Its world position is the light position. */
    public transform: TransformNode = new TransformNode();

    /**
     * Moves the light to a world position (converted into the parent's space when parented).
     * @param position The world position.
     */
    public setPosition(position: vec3): void {
        CameraTransformUtilities.setWorldPosition(this.transform, position);
    }

    /**
     * Gets the world position of the light, read from the transform.
     * @param out The optional output vector.
     */
    public getPosition(out: vec3 = vec3.create()): vec3 {
        const m = this.transform.modelMatrix;
        return vec3.set(out, m[12], m[13], m[14]);
    }

    /** Constant attenuation term. */
    public constant: number;

    /** Linear attenuation term. */
    public linear: number;

    /** Quadratic attenuation term. */
    public quadratic: number;
}
