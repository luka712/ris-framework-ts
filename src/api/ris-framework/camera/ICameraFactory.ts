import {IOrthographicCamera} from "./IOrthographicCamera";
import {vec2} from "gl-matrix";
import {OrbitCamera} from "./OrbitCamera";
import {PerspectiveCamera} from "./PerspectiveCamera";

/**
 * The camera factory.
 */
export interface ICameraFactory {

    /**
     * Creates a new perspective camera.
     * @param fov The field of view. By default, 60 degrees.
     * @param aspectRatio The aspect ratio. By default, 1.
     * @param near The near plane. By default, 0.01.
     * @param far The far plane. By default, 100.
     * @return The perspective camera.
     */
    createPerspectiveCamera(
        fov?: number,
        aspectRatio?: number,
        near?: number,
        far?: number): PerspectiveCamera;

    /**
     * Creates a new orthographic camera which is suitable for 2D games, or for UI rendering.
     * Also, suitable when orthographic projection is required, such as shadow mapping.
     * @param left - The left edge of the camera volume.
     * @param right - The right edge of the camera volume.
     * @param top - The top edge of the camera volume.
     * @param bottom - The bottom edge of the camera volume.
     * @param far - The far plane.
     * @param near - The near plane.
     * @returns The .
     */
    createOrthographicCamera(left: number, right: number, top: number, bottom: number, near: number, far: number): IOrthographicCamera;

    /**
     * The default orthographic camera.
     * @param origin - The origin point of the camera.
     * @returns The .
     */
    createDefaultOrthographicCamera(origin?: vec2): IOrthographicCamera;

    /**
     * Creates a new Orbit Camera.
     * @param fov - The field of view. By default, 60 degrees.
     * @param aspectRatio - The aspect ratio. By default, 1.
     * @param near - The near plane. By default, 0.01f.
     * @param far - The far plane. By default, 100.0f.
     * @returns The camera that acts as free and orbit camera.
     */
    createOrbitCamera(fov?: number, aspectRatio?: number, near?: number, far?: number): OrbitCamera;

    /**
     * Creates a new .
     *
     * Holds both free camera and orbit camera like controls.
     *
     * Suitable for editor.
     * @param fov - The field of view. By default, 60 degrees.
     * @param aspectRatio - The aspect ratio. By default, 1.
     * @param near - The near plane. By default, 0.01f.
     * @param far - The far plane. By default, 100.0f.
     * @returns The camera that acts as free and orbit camera.
     */
    // createFreeAndOrbitCamera(fov: number, aspectRatio: number, near: number, far: number): FreeAndOrbitCamera;

}
