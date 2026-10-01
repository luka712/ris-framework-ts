import { BlendComponentDescriptor } from "./blend-component-descriptor";
import { BlendFactor, BlendOperation } from "./enums";

/**
 * Describes the blend state of a render pipeline.
 */
export class BlendStateDescriptor {
    
    /**
     * The constructor.
     */
    public constructor() {
        const colorState = new BlendComponentDescriptor();
        colorState.srcFactor = BlendFactor.SRC_ALPHA;
        colorState.dstFactor = BlendFactor.ONE_MINUS_SRC_ALPHA;
        colorState.operation = BlendOperation.ADD;
        this.color = colorState

        const alphaState = new BlendComponentDescriptor();
        alphaState.srcFactor = BlendFactor.ONE;
        alphaState.dstFactor = BlendFactor.ONE_MINUS_SRC_ALPHA;
        alphaState.operation = BlendOperation.ADD;
        this.alpha = alphaState;
    }

    /**
     * Whether blending is enabled. If false, the source color is written to the render target without blending.
     */
    public blendingEnabled: boolean = true;

    /**
     * Color equation.
     */
    public color: BlendComponentDescriptor;

    /**
     * Alpha equation.
     */
    public alpha: BlendComponentDescriptor;
  
    /**
     * Compares this blend state descriptor with another for equality.
     * @param other The other blend state descriptor to compare with.
     * @returns True if the two descriptors are equal, false otherwise.
     */
    public equal(other: BlendStateDescriptor): boolean {
        return this.blendingEnabled === other.blendingEnabled &&
            this.color.equal(other.color) &&
            this.alpha.equal(other.alpha);
    }
}