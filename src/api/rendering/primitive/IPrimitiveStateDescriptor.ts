import type {PrimitiveTopology} from "./PrimitiveTopology.ts";
import type {CullMode} from "./CullMode.ts";
import type {FrontFace} from "./FrontFace.ts";

/**
 * Describes the state of a primitive. All fields are optional; the graphics device fills in the defaults.
 */
export interface IPrimitiveStateDescriptor {

    /**
     * The topology of the primitive.
     * By default, it is set to TRIANGLE_LIST.
     */
    topology?: PrimitiveTopology;

    /**
     * The culling mode.
     * By default, it is set to BACK.
     */
    cullFace?: CullMode;

    /**
     * The front face.
     * By default, it is set to CCW (counter clockwise).
     */
    frontFace?: FrontFace;
}
