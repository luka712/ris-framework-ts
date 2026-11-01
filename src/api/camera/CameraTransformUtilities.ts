import {mat3, mat4, vec3} from "gl-matrix";
import {TransformNode} from "../scene/node/TransformNode.ts";

const _f = vec3.create();
const _x = vec3.create();
const _y = vec3.create();
const _z = vec3.create();
const _u = vec3.create();
const _m = mat4.create();
const _n = mat3.create();
const _p = vec3.create();
const _t = vec3.create();

/**
 * Helpers shared by the cameras for deriving the view from a transform.
 * Cameras look down their local -Z axis with +Y up.
 * @internal
 */
export class CameraTransformUtilities {

    /**
     * Writes the view matrix `inverse(T * R)` from a world matrix, ignoring scale.
     * @param out The view matrix.
     * @param world The camera's world matrix (`transform.modelMatrix`).
     */
    public static viewFromWorld(out: mat4, world: mat4): mat4 {
        // Normalize the basis columns to drop scale, keeping rotation and translation (T * R).
        mat4.copy(out, world);
        for (let c = 0; c < 3; c++) {
            const i = c * 4;
            const length = Math.hypot(out[i], out[i + 1], out[i + 2]) || 1;
            out[i] /= length;
            out[i + 1] /= length;
            out[i + 2] /= length;
        }
        return mat4.invert(out, out) ?? mat4.identity(out);
    }

    /**
     * Writes the Euler rotation (the transform's Y-X-Z order) that makes a camera at `position` look at `target`
     * with `up` as the up hint (a non-vertical up rolls the camera). When `up` is parallel to the view direction,
     * the world axis least aligned with the view direction is used instead. Leaves `out` unchanged when the points are equal.
     * @param out The rotation.
     * @param position The camera position.
     * @param target The point to look at.
     * @param up The up hint. By default, world +Y.
     */
    public static lookAtRotation(out: vec3, position: vec3, target: vec3, up: vec3 = [0, 1, 0]): vec3 {
        vec3.sub(_f, target, position);
        if (vec3.sqrLen(_f) === 0) {
            return out;
        }
        vec3.normalize(_f, _f);
        vec3.negate(_z, _f);
        vec3.cross(_x, up, _z);
        if (vec3.sqrLen(_x) < 1e-12) {
            // Up is parallel to the view direction (or zero): pick the world axis least aligned with it.
            const ax = Math.abs(_f[0]), ay = Math.abs(_f[1]), az = Math.abs(_f[2]);
            vec3.set(_u, 0, 0, 0);
            _u[ay <= ax && ay <= az ? 1 : az <= ax ? 2 : 0] = 1;
            vec3.cross(_x, _u, _z);
        }
        vec3.normalize(_x, _x);
        vec3.cross(_y, _z, _x);
        // R = Ry * Rx * Rz with columns x, y, z: m23 = -sin(pitch).
        const m23 = _z[1];
        out[0] = Math.asin(Math.max(-1, Math.min(1, -m23)));
        if (Math.abs(m23) < 0.9999999) {
            out[1] = Math.atan2(_z[0], _z[2]);
            out[2] = Math.atan2(_x[1], _y[1]);
        } else {
            out[1] = Math.atan2(-_x[2], _x[0]);
            out[2] = 0;
        }
        return out;
    }

    /**
     * Writes the camera's forward direction (unit length) from a world matrix.
     * @param out The direction.
     * @param world The camera's world matrix.
     */
    public static forwardFromWorld(out: vec3, world: mat4): vec3 {
        vec3.set(out, -world[8], -world[9], -world[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Rotates a camera transform to look at a world-space point with a world-space up hint.
     * When the transform has a `TransformNode` parent, the target and up are converted into the parent's space.
     * @param transform The camera transform.
     * @param target The world point.
     * @param up The world up hint.
     */
    public static aimTransform(transform: TransformNode, target: vec3, up: vec3): void {
        const parent = transform.parent;
        if (parent instanceof TransformNode) {
            mat4.invert(_m, parent.modelMatrix);
            vec3.transformMat4(_t, target, _m);
            mat3.fromMat4(_n, _m);
            vec3.transformMat3(_p, up, _n);
            CameraTransformUtilities.lookAtRotation(transform.rotation, transform.position, _t, _p);
        } else {
            CameraTransformUtilities.lookAtRotation(transform.rotation, transform.position, target, up);
        }
    }

    /**
     * Writes a world position into `transform.position`, converting into the parent's space when it has a `TransformNode` parent.
     */
    public static setWorldPosition(transform: TransformNode, world: vec3): void {
        const parent = transform.parent;
        if (parent instanceof TransformNode) {
            mat4.invert(_m, parent.modelMatrix);
            vec3.transformMat4(transform.position, world, _m);
        } else {
            vec3.copy(transform.position, world);
        }
    }
}

/**
 * The eye / target / up state of a camera, wrapping its transform (the single source of truth).
 * @internal
 */
export class CameraAim {
    private readonly _target = vec3.create();
    private _hasTarget = false;
    private readonly _up = vec3.fromValues(0, 1, 0);

    public constructor(private readonly _transform: () => TransformNode) {
    }

    public setEye(eye: vec3): void {
        CameraTransformUtilities.setWorldPosition(this._transform(), eye);
        if (this._hasTarget) {
            this.aim();
        }
    }

    public getEye(out: vec3 = vec3.create()): vec3 {
        const m = this._transform().modelMatrix;
        return vec3.set(out, m[12], m[13], m[14]);
    }

    public setTarget(target: vec3): void {
        vec3.copy(this._target, target);
        this._hasTarget = true;
        this.aim();
    }

    public getTarget(out: vec3 = vec3.create()): vec3 {
        if (this._hasTarget) {
            return vec3.copy(out, this._target);
        }
        const m = this._transform().modelMatrix;
        CameraTransformUtilities.forwardFromWorld(_f, m);
        return vec3.set(out, m[12] + _f[0], m[13] + _f[1], m[14] + _f[2]);
    }

    public setUp(up: vec3): void {
        vec3.copy(this._up, up);
        if (this._hasTarget) {
            this.aim();
        }
    }

    public getUp(out: vec3 = vec3.create()): vec3 {
        return vec3.copy(out, this._up);
    }

    /** One-shot look-at with the current up; forgets the stored target. */
    public lookAt(target: vec3): void {
        this._hasTarget = false;
        CameraTransformUtilities.aimTransform(this._transform(), target, this._up);
    }

    /** Re-aims at the stored target. */
    public aim(): void {
        CameraTransformUtilities.aimTransform(this._transform(), this._target, this._up);
    }
}
