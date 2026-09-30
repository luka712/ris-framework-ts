import {FrontFace} from "./FrontFace";
import {CullMode} from "./CullMode";
import {PrimitiveTopology} from "./PrimitiveTopology";

/**
 * The primitive state.
 *     Describes the primitive to be rendered and how it should be rendered.
 */
export interface IPrimitiveState {

    /**
     * The topology of the primitive.
     */
    readonly topology: PrimitiveTopology;

    /**
     * The culling mode.
     */
    readonly cullFace: CullMode;

    /**
     * The front face.
     */
    readonly frontFace: FrontFace;
}
