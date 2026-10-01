import { BlendFactor, BlendOperation } from "./enums";

/**
 * Descriptor for a blend component, which defines how source and destination colors are blended together.
 */
export class BlendComponentDescriptor {

    /**
     * Multiplier for the source color/alpha which is the output of the fragment shader.
     */
    public srcFactor: BlendFactor = BlendFactor.ONE;

    /**
     * Multiplier for the destination color/alpha which is the color/alpha already in the framebuffer.
     */
    public dstFactor: BlendFactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

    /**
     * The operation to perform on the source and destination colors, multiplied by their respective factors.
     */
    public operation: BlendOperation = BlendOperation.ADD;

    /**
     * Compares this blend component descriptor with another for equality.
     * @param other The other blend component descriptor to compare with.
     * @returns True if the two descriptors are equal, false otherwise.
     */
    public equal(other: BlendComponentDescriptor): boolean {
        return this.srcFactor === other.srcFactor &&
            this.dstFactor === other.dstFactor &&
            this.operation === other.operation;
    }
}