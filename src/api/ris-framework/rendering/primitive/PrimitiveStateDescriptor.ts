import {PrimitiveTopology} from "./PrimitiveTopology";
import {CullMode} from "./CullMode";
import {FrontFace} from "./FrontFace";

/**
 * Describes the state of a primitive.
 */
export class PrimitiveStateDescriptor {

    /**
     * The topology of the primitive.
     * By default, it is set to TRIANGLE_LIST.
     */
    public topology: PrimitiveTopology = PrimitiveTopology.TRIANGLE_LIST;

    /**
     * The culling mode.
     * By default, it is set to BACK.
     */
    public cullFace: CullMode = CullMode.BACK;

    /**
     * The front face.
     * By default, it is set to CCW(counter clock-wise).
     */
    public frontFace: FrontFace = FrontFace.CCW;
}
