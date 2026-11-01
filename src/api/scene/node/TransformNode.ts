import {mat4, quat, vec3} from "gl-matrix";
import type {GameTime} from "../../time/GameTime.ts";
import {Node} from "./Node.ts";

/**
 * The node responsible for transformations in the world.
 *
 * The matrices are computed lazily: reading {@link modelMatrix} recomputes them when position, rotation or scale
 * changed (also through in-place edits), so {@link update} does not have to be called before the first render.
 * When the parent is a `TransformNode`, {@link modelMatrix} is the world matrix `parent.modelMatrix * localMatrix`.
 * @public
 */
export class TransformNode extends Node {

    private readonly _rotationQuat = quat.create();
    private readonly _localMatrix = mat4.create();
    private readonly _worldMatrix = mat4.create();
    // Cached copies to detect in-place edits; NaN forces the first computation.
    private readonly _lastPosition = vec3.fromValues(NaN, NaN, NaN);
    private readonly _lastRotation = vec3.create();
    private readonly _lastScale = vec3.create();

    /**
     * The constructor.
     */
    public constructor() {
        super();

        this.position = vec3.fromValues(0, 0, 0);
        this.rotation = vec3.fromValues(0, 0, 0);
        this.scale = vec3.fromValues(1, 1, 1);
    }

    /** Position relative to the parent (the world, without one). Defaults to the origin. In-place edits are detected. */
    public position: vec3;

    /**
     * Euler rotation in radians, applied in Y, X, Z order (yaw, pitch, roll): `R = Ry * Rx * Rz`.
     * Defaults to (0, 0, 0). In-place edits are detected.
     */
    public rotation: vec3;

    /** Scale. Defaults to (1, 1, 1). In-place edits are detected. */
    public scale: vec3;

    /** The local matrix `T * R * S`, recomputed only when position, rotation or scale changed. */
    public get localMatrix(): mat4 {
        if (!vec3.exactEquals(this._lastPosition, this.position)
            || !vec3.exactEquals(this._lastRotation, this.rotation)
            || !vec3.exactEquals(this._lastScale, this.scale)) {
            vec3.copy(this._lastPosition, this.position);
            vec3.copy(this._lastRotation, this.rotation);
            vec3.copy(this._lastScale, this.scale);
            const q = quat.identity(this._rotationQuat);
            quat.rotateY(q, q, this.rotation[1]);
            quat.rotateX(q, q, this.rotation[0]);
            quat.rotateZ(q, q, this.rotation[2]);
            mat4.fromRotationTranslationScale(this._localMatrix, q, this.position, this.scale);
        }
        return this._localMatrix;
    }

    /**
     * The model (world) matrix: {@link localMatrix}, or `parent.modelMatrix * localMatrix` when the parent is a
     * `TransformNode`. Always the same matrix object for a node without a parent transform.
     */
    public get modelMatrix(): mat4 {
        const parent = this.parent;
        if (parent instanceof TransformNode) {
            return mat4.multiply(this._worldMatrix, parent.modelMatrix, this.localMatrix);
        }
        return this.localMatrix;
    }

    /**
     * Updates the node and its transform children, recomputing the matrices if needed.
     * Called by `Scene.update` for scene nodes; optional otherwise.
     * @param gameTime The {@link GameTime}
     */
    public update(gameTime: GameTime): void {
        void this.modelMatrix;
        for (const child of this.children) {
            if (child instanceof TransformNode) {
                child.update(gameTime);
            }
        }
    }
}
