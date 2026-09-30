import {ICamera} from "./ICamera";

/**
 * The orthographic camera interface.
 */
export interface IOrthographicCamera extends ICamera {

    /**
     * The left edge of a camera volume.
     */
    left: number;

    /**
     * The right edge of a camera volume.
     */
    right: number;

    /**
     * The top edge of a camera volume.
     */
    top: number;

    /**
     * The bottom edge of a camera volume.
     */
    bottom: number;

    /**
     * The near plane of the camera.
     */
    nearPlane: number;

    /**
     * The far plane of the camera.
     */
    farPlane: number;

}
