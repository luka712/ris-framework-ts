import {vec3} from "gl-matrix";
import {Color} from "../data/Color.ts";
import {createLightId} from "./LightId.ts";
import type {Scene} from "../scene/Scene.ts";
import type {ILight} from "./ILight.ts";
import {TransformNode} from "../scene/node/TransformNode.ts";
import {CameraTransformUtilities} from "../camera/CameraTransformUtilities.ts";

const _target = vec3.create();

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

    /** The initial world direction in which the light travels (see {@link DirectionalLight.setDirection}). Defaults to straight down, (0, -1, 0). */
    direction?: vec3;
}

/**
 * The directional light. Plain data: it has no GPU resources.
 * The light travels along its transform's forward axis (local -Z), in world space; position and scale are ignored.
 * @public
 */
export class DirectionalLight implements ILight {

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
        this.setDirection(descriptor?.direction ?? [0, -1, 0]);

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

    /** The transform. Its world rotation sets the direction (forward is -Z). */
    public transform: TransformNode = new TransformNode();

    /**
     * Rotates the transform so the light travels along a world-space direction (converted into the parent's space
     * when parented). A zero vector leaves the rotation unchanged.
     * @param direction The world direction; it does not need to be normalized.
     */
    public setDirection(direction: vec3): void {
        const m = this.transform.modelMatrix;
        vec3.set(_target, m[12] + direction[0], m[13] + direction[1], m[14] + direction[2]);
        CameraTransformUtilities.aimTransform(this.transform, _target, [0, 1, 0]);
    }

    /**
     * Gets the world-space direction in which the light travels (unit length), derived from the transform.
     * @param out The optional output vector.
     */
    public getDirection(out: vec3 = vec3.create()): vec3 {
        return CameraTransformUtilities.forwardFromWorld(out, this.transform.modelMatrix);
    }
}
