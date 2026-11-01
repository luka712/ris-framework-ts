import type { IOrthographicCamera } from "./IOrthographicCamera.ts";
import type { IFramework } from "../IFramework.ts";
import {vec3, mat4} from "gl-matrix";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import {GameTime} from "../time/GameTime.ts";
import {TransformNode} from "../scene/node/TransformNode.ts";
import {CameraAim, CameraTransformUtilities} from "./CameraTransformUtilities.ts";

/**
 * The Orthographic Camera.
 */
export class OrthographicCamera implements IOrthographicCamera {

    private readonly _framework: IFramework;

    /** @ts-ignore */
    private readonly _zSpaceLength: number;

    private readonly _lastWorld = mat4.fromValues(NaN, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    private readonly _direction = vec3.create();

    private _left: number;
    private _right: number;
    private _top: number;
    private _bottom: number;
    private _near: number;
    private _far: number;

    protected _isDirty = true;

    protected _projectionMatrix = mat4.create();
    protected _viewMatrix = mat4.create();
    protected _projectionViewMatrix = mat4.create();

    /**
     * The camera transform: the single source of the view. The camera looks down its local -Z axis;
     * the view matrix is `inverse(T * R)` of `transform.modelMatrix` (scale is ignored).
     * By default, at (0, 0, 1) looking down -Z at the origin.
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

    private _projectionBuffer: IUniformBuffer = null!;
    private _viewBuffer: IUniformBuffer = null!;
    private _projectionViewBuffer: IUniformBuffer = null!;
    private _positionBuffer: IUniformBuffer = null!;
    /** std140 vec3 world-space eye, padded to 4 floats. */
    private readonly _positionData = [0, 0, 0, 0];

    /**
     *
     * @param framework
     * @param left
     * @param right
     * @param top
     * @param bottom
     * @param near
     * @param far
     */
    public constructor(
        framework: IFramework,
        left: number,
        right: number,
        top: number,
        bottom: number,
        near: number,
        far: number
    ) {
        this._framework = framework;

        this._left = left;
        this._right = right;
        this._top = top;
        this._bottom = bottom;
        this._near = near;
        this._far = far;

        vec3.set(this.transform.position, 0, 0, 1);

        this._zSpaceLength = 2; // For WebGL2 it is 2, WebGPU it is 1.

        this._updateMatrices();
    }

    /** @inheritDoc */
    public get left(): number {
        return this._left;
    }

    /** @inheritDoc */
    public set left(value: number) {
        if (this._left === value)
            return;

        this._left = value;
        this._isDirty = true;
    }

    /** @inheritDoc */
    public get right(): number {
        return this._right;
    }

    /** @inheritDoc */
    public set right(value: number) {
        if (this._right === value)
            return;

        this._right = value;
        this._isDirty = true;
    }

    /** @inheritDoc */
    public get top(): number {
        return this._top;
    }

    /** @inheritDoc */
    public set top(value: number) {
        if (this._top === value)
            return;

        this._top = value;
        this._isDirty = true;
    }

    /** @inheritDoc */
    public get bottom(): number {
        return this._bottom;
    }

    /** @inheritDoc */
    public set bottom(value: number) {
        if (this._bottom === value)
            return;

        this._bottom = value;
        this._isDirty = true;
    }

    /** @inheritDoc */
    public get nearPlane(): number {
        return this._near;
    }

    /** @inheritDoc */
    public set nearPlane(value: number) {
        if (this._near === value)
            return;

        this._near = value;
        this._isDirty = true;
    }

    /** @inheritDoc */
    public get farPlane(): number {
        return this._far;
    }

    /** @inheritDoc */
    public set farPlane(value: number) {
        if (this._far === value)
            return;

        this._far = value;
        this._isDirty = true;
    }

    /** @inheritDoc */
    public get projectionMatrix(): mat4 {
        return this._projectionMatrix;
    }

    /** @inheritDoc */
    public get projectionViewMatrix(): mat4 {
        return this._projectionViewMatrix;
    }

    /** @inheritDoc */
    public get viewMatrix(): mat4 {
        return this._viewMatrix;
    }

    /** @inheritDoc */
    public get projectionBuffer(): IUniformBuffer {
        return this._projectionBuffer;
    }

    /** @inheritDoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._projectionViewBuffer;
    }

    /** @inheritDoc */
    public get viewBuffer(): IUniformBuffer {
        return this._viewBuffer;
    }

    /** @inheritDoc */
    public get positionBuffer(): IUniformBuffer {
        return this._positionBuffer;
    }

    /** Writes the transform's world position into the std140 position data. */
    private _updatePositionData(): number[] {
        const m = this.transform.modelMatrix;
        this._positionData[0] = m[12];
        this._positionData[1] = m[13];
        this._positionData[2] = m[14];
        return this._positionData;
    }

    /** True when the transform's world matrix changed since the view was last built. */
    private _transformChanged(): boolean {
        return !mat4.exactEquals(this._lastWorld, this.transform.modelMatrix);
    }

    /**
     * Updates the camera matrices.
     */
    protected _updateMatrices() {
        const world = this.transform.modelMatrix;
        mat4.copy(this._lastWorld, world);
        CameraTransformUtilities.viewFromWorld(this._viewMatrix, world);
        mat4.orthoNO(this._projectionMatrix, this._left, this._right, this._bottom, this._top, this._near, this._far);
        mat4.multiply(this._projectionViewMatrix, this._projectionMatrix, this._viewMatrix);
    }

    /** @inheritDoc */
    public initialize(): void {

        this._projectionBuffer = this._framework.bufferFactory.createUniformBuffer(
            this._projectionMatrix, BufferUsage.UNIFORM, "OrthographicCamera.projectionBuffer"
        );

        this._viewBuffer = this._framework.bufferFactory.createUniformBuffer(
            this._viewMatrix, BufferUsage.UNIFORM, "OrthographicCamera.viewBuffer"
        );

        this._projectionViewBuffer = this._framework.bufferFactory.createUniformBuffer(
            this._projectionViewMatrix, BufferUsage.UNIFORM, "OrthographicCamera.projectionViewBuffer"
        );

        this._positionBuffer = this._framework.bufferFactory.createUniformBuffer(
            this._updatePositionData(), BufferUsage.UNIFORM, "OrthographicCamera.positionBuffer"
        );
    }

    /** @inheritDoc */
    public updateBuffers(): void {
        this._updateMatrices();
        this.projectionBuffer.update(this.projectionMatrix);
        this.viewBuffer.update(this.viewMatrix);
        this.projectionViewBuffer.update(this.projectionViewMatrix);
        this.positionBuffer.update(this._updatePositionData());
    }

    /** @inheritDoc */
    public update(_: GameTime): void {

        if (!this._isDirty && !this._transformChanged())
            return;

        this.updateBuffers();
        this._isDirty = false;
    }

    /** @inheritDoc */
    public dispose(): void {

        this.projectionBuffer.dispose();
        this.projectionViewBuffer.dispose();
        this.viewBuffer.dispose();
        this.positionBuffer.dispose();
    }
}