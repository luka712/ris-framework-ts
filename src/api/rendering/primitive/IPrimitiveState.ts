import {FrontFace} from "./FrontFace.ts";
import {CullMode} from "./CullMode.ts";
import {PrimitiveTopology} from "./PrimitiveTopology.ts";

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
