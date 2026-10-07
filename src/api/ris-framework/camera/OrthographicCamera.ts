import {IOrthographicCamera} from "./IOrthographicCamera";
import {IFramework} from "../IFramework";
import {vec3, mat4} from "gl-matrix";
import {IUniformBuffer} from "../rendering/buffers/IUniformBuffer";
import {BufferUsage} from "../rendering/buffers/BufferUsage";
import {GameTime} from "../time/GameTime";

/**
 * The Orthographic Camera.
 */
export class OrthographicCamera implements IOrthographicCamera {

    static UP_VECTOR = vec3.fromValues(0, 1, 0);

    private readonly _framework: IFramework;

    /** @ts-ignore */
    private readonly _zSpaceLength: number;

    private _eye: vec3;
    private _target: vec3;

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

    public readonly position = vec3.create();
    public readonly target = vec3.create();
    public readonly direction = vec3.create();

    private _projectionBuffer: IUniformBuffer = null!;
    private _viewBuffer: IUniformBuffer = null!;
    private _projectionViewBuffer: IUniformBuffer = null!;

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

        this._eye = vec3.fromValues(0, 0, -1);
        this._target = vec3.fromValues(0, 0, 0);

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
    public get eye(): vec3 {
        return this._eye;
    }

    /** @inheritDoc */
    public set eye(value: vec3) {
        if (this._eye === value)
            return;
        this._eye = value;
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

    /**
     * Updates the camera matrices.
     */
    protected _updateMatrices() {
        mat4.lookAt(this._viewMatrix, this._eye, this._target, OrthographicCamera.UP_VECTOR);
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
    }

    /** @inheritDoc */
    public updateBuffers(): void {
        this._updateMatrices();
        this.projectionBuffer.update(this.projectionMatrix);
        this.viewBuffer.update(this.viewMatrix);
        this.projectionViewBuffer.update(this.projectionViewMatrix);
    }

    /** @inheritDoc */
    public update(_: GameTime): void {

        if (!this._isDirty)
            return;

        this.updateBuffers();
        this._isDirty = false;
    }

    /** @inheritDoc */
    public dispose(): void {

        this.projectionBuffer.dispose();
        this.projectionViewBuffer.dispose();
        this.viewBuffer.dispose();
    }
}