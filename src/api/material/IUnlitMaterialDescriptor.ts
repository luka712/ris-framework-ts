import type {IPrimitiveState} from "../rendering/primitive/IPrimitiveState.ts";
import type {ICamera} from "../camera/ICamera.ts";

/**
 * The descriptor for an unlit material. All fields are optional.
 * @public
 */
export interface IUnlitMaterialDescriptor {

    /** The primitive state. By default, the render pipeline's default (back-face culled, counter-clockwise triangles). */
    primitiveState?: IPrimitiveState;

    /**
     * The camera used to render this material. By default, none: a zero projection view buffer is bound
     * until a camera is assigned (a scene assigns its camera).
     */
    camera?: ICamera;
}
