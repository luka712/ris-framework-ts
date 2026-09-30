import {ICamera} from "./ICamera";
import {mat4, vec3} from "gl-matrix";
import {IFramework} from "../IFramework";
import {MathHelper} from "../utilities/MathHelper";
import {BufferUsage} from "../rendering/buffers/BufferUsage";
import {IUniformBuffer} from "../rendering/buffers/IUniformBuffer";
import {GameTime} from "../time/GameTime";

/**
 * The perspective camera.
 */
export class PerspectiveCamera implements ICamera {

    protected readonly _framework: IFramework;
    private readonly _tempVec3 = vec3.create();

    private _projectionMatrix = mat4.create();
    private _viewMatrix = mat4.create();
    private _projectionViewMatrix = mat4.create();

    private _direction = vec3.create();

    private _positionBuffer: IUniformBuffer = null!;
    private _projectionViewBuffer: IUniformBuffer = null!;
    private _viewBuffer: IUniformBuffer = null!;
    private _projectionBuffer: IUniformBuffer = null!;

    /**
     * The constructor.
     * @param framework The framework.
     * @param fov The field of view in radians.
     * @param aspectRatio The aspect ratio.
     * @param nearPlane The near plane.
     * @param farPlane The far plane.
     */
    public constructor(
        framework: IFramework,
        fov: number,
        aspectRatio: number,
        nearPlane: number,
        farPlane: number) {
        this._framework = framework;
        this.fieldOfView = fov;
        this.aspectRatio = aspectRatio;
        this.nearPlane = nearPlane;
        this.farPlane = farPlane;

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
     * The eye position of the camera.
     */
    public eye = vec3.fromValues(0,0,3);

    /**
     * The target position of the camera.
     */
    public target = vec3.create();

    /**
     * The up vector of the camera.
     */
    public up = vec3.fromValues(0,1,0);

    /** The direction of a camera. */
    public get direction(): vec3 {
        vec3.sub(this._direction, this.target, this.eye);
        return this._direction;
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
        this._positionBuffer = this._framework.bufferFactory.createUniformBuffer(this.eye, bufferUsage);
        this._projectionViewBuffer = this._framework.bufferFactory.createUniformBuffer(this.projectionViewMatrix, bufferUsage);
        this._projectionBuffer = this._framework.bufferFactory.createUniformBuffer(this.projectionMatrix, bufferUsage);
        this._viewBuffer = this._framework.bufferFactory.createUniformBuffer(this.viewMatrix, bufferUsage);
    }

    /**
     * Updates the camera matrices.
     */
    protected _updateMatrices(): void {

        // Right-handed
        mat4.perspectiveNO(this._projectionMatrix, this.fieldOfView, this.aspectRatio, this.nearPlane, this.farPlane);

        // mat4 does not have right-handed look at, therefore swap z for right-handed matrix.
        this._tempVec3[0] = this.eye[0];
        this._tempVec3[1] = this.eye[1];
        this._tempVec3[2] = -this.eye[2];
        mat4.lookAt(this.viewMatrix, this._tempVec3, this.target, this.up);
        mat4.multiply(this.projectionViewMatrix, this.projectionMatrix, this.viewMatrix);
    }

    /** @inheritDoc */
    public update(time: GameTime): void {
        this._updateMatrices();
        this.updateBuffers();
    }

    /** @inheritDoc */
    public updateBuffers(): void {
        this._positionBuffer.update(this.eye);
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
