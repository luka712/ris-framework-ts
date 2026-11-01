import type { ICamera } from "./ICamera.ts";
import {mat4, vec3} from "gl-matrix";
import type { IFramework } from "../IFramework.ts";
import {MathHelper} from "../utilities/MathHelper.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import {GameTime} from "../time/GameTime.ts";
import type {Scene} from "../scene/Scene.ts";
import {TransformNode} from "../scene/node/TransformNode.ts";
import {CameraAim, CameraTransformUtilities} from "./CameraTransformUtilities.ts";

/**
 * The descriptor for a perspective camera. Every field is optional.
 */
export interface PerspectiveCameraDescriptor {

    /** The vertical field of view in degrees. By default, 60. */
    fov?: number;

    /** The aspect ratio (width / height). By default, 1. */
    aspectRatio?: number;

    /** The near plane. By default, 0.01. */
    near?: number;

    /** The far plane. By default, 100. */
    far?: number;

    /** The world position (see {@link ICamera.setEye}). By default, (0, 0, -3). */
    position?: vec3;

    /** Alias of {@link position}; `position` wins when both are given. */
    eye?: vec3;

    /** The point the camera looks at (see {@link ICamera.setTarget}). By default, the origin. */
    target?: vec3;

    /** The up vector used to aim (see {@link ICamera.setUp}). By default, (0, 1, 0). */
    up?: vec3;
}

/**
 * The perspective camera.
 */
export class PerspectiveCamera implements ICamera {

    protected readonly _framework: IFramework;
    private readonly _lastWorld = mat4.fromValues(NaN, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    private readonly _positionData = [0, 0, 0, 0];

    private _projectionMatrix = mat4.create();
    private _viewMatrix = mat4.create();
    private _projectionViewMatrix = mat4.create();

    private _direction = vec3.create();

    private _positionBuffer: IUniformBuffer = null!;
    private _projectionViewBuffer: IUniformBuffer = null!;
    private _viewBuffer: IUniformBuffer = null!;
    private _projectionBuffer: IUniformBuffer = null!;

    /**
     * The constructor. Call `initialize()` before use (the camera factory does).
     * @param framework The framework.
     * @param descriptor The optional descriptor; omitted fields use the defaults documented on {@link PerspectiveCameraDescriptor}.
     *                   `fov` is in degrees; {@link fieldOfView} holds it in radians. Vectors are copied.
     * @param scene The optional scene; the camera assigns itself as `scene.camera`.
     */
    public constructor(
        framework: IFramework,
        descriptor?: PerspectiveCameraDescriptor,
        scene?: Scene) {
        this._framework = framework;
        this.fieldOfView = MathHelper.toRadians(descriptor?.fov ?? 60);
        this.aspectRatio = descriptor?.aspectRatio ?? 1;
        this.nearPlane = descriptor?.near ?? 0.01;
        this.farPlane = descriptor?.far ?? 100;
        vec3.copy(this.transform.position, descriptor?.position ?? descriptor?.eye ?? [0, 0, -3]);
        if (descriptor?.up) {
            this.setUp(descriptor.up);
        }
        this.setTarget(descriptor?.target ?? [0, 0, 0]);
        if (scene) {
            scene.add(this);
        }

        this._updateMatrices();
    }

    /**
     * The projection matrix.
     */
    public get projectionMatrix(): mat4 {
        return this._projectionMatrix;
    }

    /**
     * The projection matrix.
     */
    public set projectionMatrix(value: mat4) {
        this._projectionMatrix = value;
    }

    /**
     * The view matrix.
     */
    public get viewMatrix(): mat4 {
        return this._viewMatrix;
    }

    /**
     * The view matrix.
     */
    public set viewMatrix(value: mat4) {
        this._viewMatrix = value;
    }

    /**
     * The projection view matrix.
     */
    public get projectionViewMatrix(): mat4 {
        return this._projectionViewMatrix;
    }

    /**
     * The projection view matrix.
     */
    public set projectionViewMatrix(value: mat4) {
        this._projectionViewMatrix = value;
    }

    /** @inheritDoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._projectionViewBuffer;
    }

    /** @inheritDoc */
    public get projectionBuffer(): IUniformBuffer {
        return this._projectionBuffer;
    }

    /** @inheritDoc */
    public get viewBuffer(): IUniformBuffer {
        return this._viewBuffer;
    }

    /** @inheritDoc */
    public get positionBuffer(): IUniformBuffer {
        return this._positionBuffer;
    }

    /**
     * The camera transform: the single source of the view. The camera looks down its local -Z axis;
     * the view matrix is `inverse(T * R)` of `transform.modelMatrix` (scale is ignored).
     * By default, at (0, 0, -3) looking at the origin.
     */
    public transform = new TransformNode();

    /** The unit direction the camera looks in, from the transform. */
    public get direction(): vec3 {
        return CameraTransformUtilities.forwardFromWorld(this._direction, this.transform.modelMatrix);
    }

    private readonly _aim = new CameraAim(() => this.transform);

    /**
     * Rotates the transform once so the camera looks at a world point, using the current up ({@link getUp}).
     * Forgets the target stored by {@link setTarget}, so a later {@link setEye} does not re-aim.
     * @param target The point to look at.
     */
    public lookAt(target: vec3): void {
        this._aim.lookAt(target);
    }

    /** @inheritDoc */
    public setEye(eye: vec3): void {
        this._aim.setEye(eye);
    }

    /** @inheritDoc */
    public getEye(out?: vec3): vec3 {
        return this._aim.getEye(out);
    }

    /** @inheritDoc */
    public setTarget(target: vec3): void {
        this._aim.setTarget(target);
    }

    /** @inheritDoc */
    public getTarget(out?: vec3): vec3 {
        return this._aim.getTarget(out);
    }

    /** @inheritDoc */
    public setUp(up: vec3): void {
        this._aim.setUp(up);
    }

    /** @inheritDoc */
    public getUp(out?: vec3): vec3 {
        return this._aim.getUp(out);
    }

    /**
     * The field of view of the camera.
     */
    public fieldOfView = MathHelper.toRadians(60);

    /**
     * The aspect ratio of the camera.
     */
    public aspectRatio = 1;

    /**
     * The near plane of the camera.
     */
    public nearPlane = 0.01;

    /**
     * The far plane of the camera.
     */
    public farPlane = 1000;

    /** @inheritDoc */
    public readonly coreCamera: ICamera | undefined = undefined;

    /**
     * Initialize the camera.
     */
    public initialize(): void {
        const bufferUsage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
        this._positionBuffer = this._framework.bufferFactory.createUniformBuffer(this._worldEye(), bufferUsage);
        this._projectionViewBuffer = this._framework.bufferFactory.createUniformBuffer(this.projectionViewMatrix, bufferUsage);
        this._projectionBuffer = this._framework.bufferFactory.createUniformBuffer(this.projectionMatrix, bufferUsage);
        this._viewBuffer = this._framework.bufferFactory.createUniformBuffer(this.viewMatrix, bufferUsage);
    }

    /** The world position, std140 `vec3` (padded to 16 bytes). This is what {@link positionBuffer} holds. */
    private _worldEye(): number[] {
        const m = this.transform.modelMatrix;
        this._positionData[0] = m[12];
        this._positionData[1] = m[13];
        this._positionData[2] = m[14];
        return this._positionData;
    }

    /**
     * Updates the camera matrices.
     */
    protected _updateMatrices(): void {

        // Right-handed
        mat4.perspectiveNO(this._projectionMatrix, this.fieldOfView, this.aspectRatio, this.nearPlane, this.farPlane);

        // The view only changes when the transform's world matrix changed.
        const world = this.transform.modelMatrix;
        if (!mat4.exactEquals(this._lastWorld, world)) {
            mat4.copy(this._lastWorld, world);
            CameraTransformUtilities.viewFromWorld(this.viewMatrix, world);
        }
        mat4.multiply(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
    }

    /** @inheritDoc */
    public update(time: GameTime): void {
        void time;
        this._updateMatrices();
        this.updateBuffers();
    }

    /** @inheritDoc */
    public updateBuffers(): void {
        this._positionBuffer.update(this._worldEye());
        this._projectionBuffer.update(this.projectionMatrix);
        this._viewBuffer.update(this.viewMatrix);
        this._projectionViewBuffer.update(this.projectionViewMatrix);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._viewBuffer.dispose();
        this._projectionBuffer.dispose();
        this._projectionViewBuffer.dispose();
        this._positionBuffer.dispose();
    }
}
