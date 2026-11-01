import {vec3, mat4, vec2} from "gl-matrix";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import {PerspectiveCamera} from "./PerspectiveCamera.ts";
import type { IInputManager } from "../input/IInputManager.ts";
import {MathHelper} from "../utilities/MathHelper.ts";
import type { ICamera } from "./ICamera.ts";
import {MouseState} from "../input/mouse/MouseState.ts";
import {GameTime} from "../time/GameTime.ts";
import {MouseButton} from "../input/mouse/MouseButton.ts";
import {TouchCollection} from "../input/touch/TouchCollection.ts";
import {TouchLocation} from "../input/touch/TouchLocation.ts";
import {InputDeviceType} from "../input/InputDeviceType.ts";
import {CameraTransformUtilities} from "./CameraTransformUtilities.ts";
import type {TransformNode} from "../scene/node/TransformNode.ts";

/**
 * Camerae that support orbit movement.
 */
export class OrbitCamera implements ICamera {

    private readonly POSITIVE_89_DEG = 1.55334;
    private readonly POSITIVE_179_DEG = 3.124139;

    private readonly _tempVec3 = vec3.create();
    private readonly _tempDirection = vec3.create();
    private readonly _tempNextDirection = vec3.create();
    private readonly _tempNextEye = vec3.create();

    /** For pinch zoom. The distance between the two touches on the previous pinch frame. */
    private _lastTouchDistance = 0;

    private readonly _coreCamera: PerspectiveCamera;
    private readonly _inputManager: IInputManager

    /** The rotation around the vertical axis. */
    private readonly _target = vec3.create();
    private _yaw = 0;

    /** The tilt of the camera.*/
    private _pitch = 0;

    /**
     * The constructor.
     * @param coreCamera The underlying core camera.
     * @param inputManager The input manager.
     * @param supportedInputTypes The input devices that control the camera.
     */
    public constructor(coreCamera: PerspectiveCamera,
                       inputManager: IInputManager,
                       public supportedInputTypes: InputDeviceType = InputDeviceType.MOUSE | InputDeviceType.TOUCHPAD) {
        this._coreCamera = coreCamera;
        this._inputManager = inputManager;
        vec3.set(this._coreCamera.transform.position, 0, 0, 3);
        this._syncFromTransform();
        void this.POSITIVE_179_DEG;
        void this.findTarget;
    }

    /** The mouse sensitivity. */
    public sensitivity = 0.05;

    /** The speed of scrolling related options. */
    public scrollSpeed = 1;

    /** The maximum scrolling speed. */
    public maxScrollSpeed: number = 50;

    /** The speed of pinch.*/
    public pinchSpeed: number = 1;

    /** The up vector. */

    /** The clamp values of pitch axis */
    public pitchClamp = vec2.fromValues(-this.POSITIVE_89_DEG, this.POSITIVE_89_DEG);

    /** @inheritDoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._coreCamera.projectionViewBuffer;
    }

    /** @inheritDoc */
    public get projectionBuffer(): IUniformBuffer {
        return this._coreCamera.projectionBuffer;
    }

    /** @inheritDoc */
    public get viewBuffer(): IUniformBuffer {
        return this._coreCamera.viewBuffer;
    }

    /** @inheritDoc */
    public get positionBuffer(): IUniformBuffer {
        return this._coreCamera.positionBuffer;
    }

    /** @inheritDoc */
    public get projectionMatrix(): mat4 {
        return this._coreCamera.projectionMatrix;
    }

    /** @inheritDoc */
    public get viewMatrix(): mat4 {
        return this._coreCamera.viewMatrix;
    }

    /** @inheritDoc */
    public set viewMatrix(value: mat4) {
        this._coreCamera.viewMatrix = value;
    }

    /** @inheritDoc */
    public get projectionViewMatrix(): mat4 {
        return this._coreCamera.projectionViewMatrix;
    }

    /** @inheritDoc */
    public get direction(): vec3 {
        return this._coreCamera.direction;
    }

    /** Orbit controls can be used if this button is pressed. */
    public orbitButton = MouseButton.LEFT;

    /** The orbit camera's transform: the core camera's transform. Its position is the eye; the rotation is set each update to look at {@link target}. */
    public get transform(): TransformNode {
        return this._coreCamera.transform;
    }

    /**
     * Sets the point the camera orbits around and looks at (the core camera's target). By default, the origin.
     * @param target The world point.
     */
    public setTarget(target: vec3): void {
        vec3.copy(this._target, target);
        this._syncFromTransform();
    }

    /** @inheritDoc */
    public getTarget(out: vec3 = vec3.create()): vec3 {
        return vec3.copy(out, this._target);
    }

    /**
     * Moves the camera to a world position and re-derives the orbit (pitch, yaw, distance) around the target.
     * @param eye The world position.
     */
    public setEye(eye: vec3): void {
        CameraTransformUtilities.setWorldPosition(this._coreCamera.transform, eye);
        this._syncFromTransform();
    }

    /** @inheritDoc */
    public getEye(out?: vec3): vec3 {
        return this._coreCamera.getEye(out);
    }

    /** Sets the up vector the core camera aims with (the orbit angles stay around world +Y, so this rolls the view). */
    public setUp(up: vec3): void {
        this._coreCamera.setUp(up);
        this._coreCamera.setTarget(this._target);
    }

    /** @inheritDoc */
    public getUp(out?: vec3): vec3 {
        return this._coreCamera.getUp(out);
    }

    /** The eye: `transform.position` (world space). */
    private get _eye(): vec3 {
        return this._coreCamera.transform.position;
    }

    /** Re-derives pitch and yaw from the eye and target, and aims the core camera at the target. */
    private _syncFromTransform(): void {
        vec3.sub(this._tempDirection, this._target, this._eye);
        if (vec3.sqrLen(this._tempDirection) === 0) {
            return;
        }
        this._setPitchAndYawFromDirection(this._tempDirection);
        this._coreCamera.setTarget(this._target);
    }

    public get coreCamera(): ICamera | undefined {
        return this._coreCamera;
    }

    /**
     * Find a target from yaw and pitch.
     */
    private findTarget(): void {
        throw new Error('Not implemented');
    }


    /** @inheritDoc */
    public initialize(): void {
        throw new Error('Not implemented');
    }

    public updateBuffers(): void {
        throw new Error('Not implemented');
    }

    private _pitchClamp(value: number): number {
        return MathHelper.clamp(value, this.pitchClamp[0], this.pitchClamp[1]);
    }

    /**
     * Sets the pitch and yaw from look direction.
     * @param lookDirection The direction.
     * @private
     */
    private _setPitchAndYawFromDirection(lookDirection: vec3) {
        vec3.normalize(lookDirection, lookDirection);
        const y = MathHelper.clamp(lookDirection[1], -1, 1);
        this._pitch = -this._pitchClamp(Math.asin(y));
        // World direction; the orbit angles keep their original z-flipped convention.
        this._yaw = -Math.atan2(lookDirection[0], 0 - lookDirection[2]);
    }

    private _calculateOrbitMovement() {
        // Clamp between [1.0, 179.0] degrees.
        this._pitch = this._pitchClamp(this._pitch);

        // Convert spherical coordinates to Cartesian
        vec3.sub(this._tempVec3, this._target, this._eye);
        const radius = vec3.len(this._tempVec3);

        const sinPitch = Math.sin(this._pitch);
        const cosPitch = Math.cos(this._pitch);

        const x = radius * cosPitch * Math.sin(this._yaw);
        const y = radius * sinPitch;
        const z = radius * cosPitch * Math.cos(this._yaw);

        this._tempVec3[0] = x;
        this._tempVec3[1] = y;
        this._tempVec3[2] = z;
        vec3.add(this._eye, this._target, this._tempVec3);
        this._coreCamera.setTarget(this._target);
    }

    /**
     * Handles the mouse movement for orbit camera.
     * @param mouseState The mouse state.
     * @param deltaTime The delta time.
     */
    private _handleOrbitMouseMovement(mouseState: MouseState, deltaTime: number): void {
        const dt = deltaTime * this.sensitivity;
        this._yaw -= mouseState.dX * dt;
        this._pitch += mouseState.dY * dt;
        this._calculateOrbitMovement();
    }

    /**
     * Handles touch orbit and pinch zoom.
     * One finger down orbits. Two fingers down pinch. Released and cancelled contacts are ignored.
     * @param touches The touch locations.
     * @param deltaTime The delta time.
     */
    private _handleOrbitTouch(touches: TouchCollection, deltaTime: number): void {
        let down = 0;
        let first: TouchLocation | undefined;
        let second: TouchLocation | undefined;
        const count = touches.count;
        for (let i = 0; i < count; i++) {
            const touch = touches.get(i);
            if (touch === undefined || !touch.isDown) {
                continue;
            }
            if (down === 0) {
                first = touch;
            } else if (down === 1) {
                second = touch;
            }
            down++;
        }

        // One finger orbits.
        if (down === 1 && first !== undefined) {
            const dt = deltaTime * this.sensitivity;
            this._yaw -= first.dX * dt;
            this._pitch += first.dY * dt;
            this._calculateOrbitMovement();
            return;
        }

        if (down !== 2 || first === undefined || second === undefined) {
            return;
        }

        const d = vec2.distance(first.position, second.position);
        const diff = d - this._lastTouchDistance;
        this._lastTouchDistance = d;

        // Nothing to do, same distance.
        if(diff == 0) {
            return;
        }

        // Find the current distance.
        vec3.sub(this._tempDirection, this._target, this._eye);

        // Find the next eye position.
        vec3.normalize(this._tempDirection, this._tempDirection);
        vec3.copy(this._tempNextEye, this._eye);

        if (diff < 0) {
            vec3.scale(this._tempVec3, this._tempDirection, this.pinchSpeed * deltaTime);
            vec3.sub(this._tempNextEye, this._tempNextEye, this._tempVec3);
        } else {
            vec3.scale(this._tempVec3, this._tempDirection, this.pinchSpeed * deltaTime);
            vec3.add(this._tempNextEye, this._tempNextEye, this._tempVec3);
        }

        // Find the new potential length.
        vec3.sub(this._tempNextDirection, this._target, this._tempNextEye);
        const nextLength = vec3.len(this._tempNextDirection);
        vec3.normalize(this._tempNextDirection, this._tempNextDirection);

        // Difference between next direction and direction.
        vec3.sub(this._tempVec3, this._tempNextDirection, this._tempDirection);
        const lenSq =vec3.sqrLen(this._tempVec3);

        // Only if within bounds set and no change in direction of a vector.
        if (nextLength < this._coreCamera.nearPlane
            || nextLength > this._coreCamera.farPlane
            || lenSq > 0.1
        ) {
            return;
        }

        vec3.copy(this._eye, this._tempNextEye);
        this._syncFromTransform();
    }

    /** Handles forward/backward movement */
    private _handleMouseForwardBackwardMovement(mouseState: MouseState, deltaTime: number) {

        const mouseScrollPos = mouseState.scrollWheelPosition[1];

        if (mouseScrollPos == 0) {
            return;
        }

        // Find the current distance.
        vec3.sub(this._tempDirection, this._target, this._eye);
        const distance = vec3.len(this._tempDirection);

        // Map it to [1,0.1f] space.
        const step = MathHelper.map(distance,
            this._coreCamera.nearPlane, this._coreCamera.farPlane,
            1, 0.1);

        // Scroll speed is scaled with the distance between eye and target.
        // - The closer the target is, the slower the scroll speed.
        let trueScrollSpeed = step * this.scrollSpeed;

        // Clamp to the max scroll speed.
        if (trueScrollSpeed > this.maxScrollSpeed) {
            trueScrollSpeed = this.maxScrollSpeed;
        }

        // Find the next eye position.
        vec3.normalize(this._tempDirection, this._tempDirection);
        vec3.copy(this._tempNextEye, this._eye);

        if (mouseScrollPos > 0) {
            vec3.scale(this._tempVec3, this._tempDirection, trueScrollSpeed * deltaTime);
            vec3.sub(this._tempNextEye, this._tempNextEye, this._tempVec3);
        } else {
            vec3.scale(this._tempVec3, this._tempDirection, trueScrollSpeed * deltaTime);
            vec3.add(this._tempNextEye, this._tempNextEye, this._tempVec3);
        }

        // Find the new potential length.
        vec3.sub(this._tempNextDirection, this._target, this._tempNextEye);
        const nextLength = vec3.len(this._tempNextDirection);
        vec3.normalize(this._tempNextDirection, this._tempNextDirection);

        // Difference between next direction and direction.
        vec3.sub(this._tempVec3, this._tempNextDirection, this._tempDirection);
        const lenSq =vec3.sqrLen(this._tempVec3);

        // Only if within bounds set and no change in direction of a vector.
        if (nextLength < this._coreCamera.nearPlane
            || nextLength > this._coreCamera.farPlane
            || lenSq > 0.01
        ) {
            return;
        }

        vec3.copy(this._eye, this._tempNextEye);
        this._syncFromTransform();
    }

    /** @inheritDoc */
    public update(time: GameTime): void {

        //  vec3.sub(this._tempVec3, this.target, this.eye);
        // this._setPitchAndYawFromDirection(this._tempVec3);

        const deltaTime = time.deltaTimeSec;

        const mouseSupported = (this.supportedInputTypes & InputDeviceType.MOUSE) !== 0;
        const touchSupported = (this.supportedInputTypes & InputDeviceType.TOUCHPAD) !== 0;

        // Control pitch and yaw with mouse.
        const mouseState = this._inputManager.getMouseState();

        // If we have a mouse, use mouse.
        if (mouseSupported && mouseState.isButtonDown(this.orbitButton)) {
            this._handleOrbitMouseMovement(mouseState, deltaTime);
        } else {

            // Otherwise orbit and pinch with touch.
            if (touchSupported) {
                this._handleOrbitTouch(this._inputManager.getTouchCollection(), deltaTime);
            }

            // Usually done with scroll wheel.
            if (mouseSupported) {
                this._handleMouseForwardBackwardMovement(mouseState, deltaTime);
            }
        }

        this._coreCamera.setTarget(this._target);
        this._coreCamera.update(time);
    }

    /** @inheritDoc */
    public dispose(): void {
        this._coreCamera.dispose();
    }
}
