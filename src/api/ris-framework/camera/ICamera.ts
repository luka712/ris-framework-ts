import {IDisposable} from "../core/IDisposable";
import {mat4} from "gl-matrix"
import {IUniformBuffer} from "../rendering/buffers/IUniformBuffer";
import {GameTime} from "../time/GameTime";

/** The camera interface. */
export interface ICamera extends IDisposable {

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
     * Update the GPU buffers.
     * This needs to be called when camera properties are changed.
     */
    updateBuffers(): void;

    /**
     * Update the camera.
     * @param time - The game time object.
     Use this for time-based movements.
     */
    update(time: GameTime): void;

}
