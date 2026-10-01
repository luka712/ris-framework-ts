import { CullMode, FrontFace, PrimitiveTopology } from "./enums";

/** 
* Describes the state of a primitive.
*/
export class PrimitiveStateDescriptor {
    /**
    * The constructor.
    */
    public constructor() {
        this.topology = PrimitiveTopology.TRIANGLE_LIST;
        this.cullFace = CullMode.BACK;
        this.frontFace = FrontFace.CCW;
    }

    /**
    * The topology of the primitive.
    * By default, it is set to <see cref="PrimitiveTopology.TRIANGLE_LIST"/>.
    */
    public topology: PrimitiveTopology;

    /**
    * The culling mode.
    * By default, it is set to <see cref="CullMode.BACK"/>.
    */
    public cullFace: CullMode;
    /** 
    * The front face.
    * By default, it is set to <see cref="FrontFace.CCW"/>.
    */
    public frontFace: FrontFace;
}