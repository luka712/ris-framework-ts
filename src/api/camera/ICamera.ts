import type { IDisposable } from "../core/IDisposable.ts";
import {mat4, vec3} from "gl-matrix"
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import {GameTime} from "../time/GameTime.ts";
import type {ISceneObject} from "../scene/ISceneObject.ts";

/** The camera interface. */
export interface ICamera extends ISceneObject, IDisposable {

    /**
     * The projection matrix.
     */
    readonly projectionMatrix: mat4;

    /**
     * The view matrix.
     */
    readonly viewMatrix: mat4;

    /**
     * The projection view matrix.
     */
    readonly projectionViewMatrix: mat4;

    /**
     * The projection view buffer.
     */
    readonly projectionViewBuffer: IUniformBuffer;

    /**
     * The projection buffer.
     */
    readonly projectionBuffer: IUniformBuffer;

    /**
     * The view buffer.
     */
    readonly viewBuffer: IUniformBuffer;

    /**
     * The world-space eye position buffer, std140 `vec3` (`[x, y, z, 0]`).
     * Used by lit materials for specular highlights.
     */
    readonly positionBuffer: IUniformBuffer;

    /**
     * Update the GPU buffers.
     * This needs to be called when camera properties are changed.
     */
    updateBuffers(): void;

    /**
     * Moves the camera: writes `transform.position` from a world position (converted into the parent's space
     * when the transform has a `TransformNode` parent). Re-aims at the target when one was set with {@link setTarget},
     * keeping the old eye/target behaviour; otherwise the rotation is kept.
     * @param eye The world position.
     */
    setEye(eye: vec3): void;

    /**
     * The world position of the camera (the transform's world translation).
     * @param out Optional vector to write into.
     */
    getEye(out?: vec3): vec3;

    /**
     * Stores the target and rotates the transform to look at it with the current up ({@link getUp}).
     * @param target The world point to look at.
     */
    setTarget(target: vec3): void;

    /**
     * The last target set with {@link setTarget}, or the eye plus the view direction when none is set.
     * @param out Optional vector to write into.
     */
    getTarget(out?: vec3): vec3;

    /**
     * Sets the up vector used when aiming (world space, by default (0, 1, 0)); a non-vertical up rolls the camera.
     * Re-aims when a target is set. An up parallel to the view direction falls back to the world axis least aligned with it.
     * @param up The up vector.
     */
    setUp(up: vec3): void;

    /**
     * The up vector used when aiming.
     * @param out Optional vector to write into.
     */
    getUp(out?: vec3): vec3;

    /**
     * Update the camera.
     * @param time - The game time object.
     Use this for time-based movements.
     */
    update(time: GameTime): void;

}
