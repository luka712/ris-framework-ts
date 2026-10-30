import type { IMaterial } from "./IMaterial.ts";
import type { ICamera } from "../camera/ICamera.ts";

/**
 * A material that renders with a camera (unlit, Blinn-Phong, inspect mips).
 * A `Scene` assigns its camera to these materials in `scene.update()`.
 * @public
 */
export interface ICameraMaterial extends IMaterial {

    /** The camera. Setting it binds the camera's buffers. */
    camera?: ICamera;
}

/**
 * Whether a material is an {@link ICameraMaterial}.
 * @param material The material.
 * @public
 */
export function isCameraMaterial(material: IMaterial | undefined): material is ICameraMaterial {
    return !!material && "camera" in material;
}
