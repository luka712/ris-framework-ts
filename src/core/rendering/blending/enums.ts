/**
 * The blend operation.
 */
export enum BlendOperation {
    /**
     * Add the source and destination colors together, multiplied by their respective factors.
     */
    ADD,

    /**
     * Subtract the destination color from the source color, multiplied by their respective factors.
     */
    SUBTRACT,

    /**
     * Reverse subtract the source color from the destination color, multiplied by their respective factors.
     */
    REVERSE_SUBTRACT,

    /**
     * Select the minimum of the source and destination colors, multiplied by their respective factors.
     */
    MIN,

    /**
     * Select the maximum of the source and destination colors, multiplied by their respective factors.
     */
    MAX,
}

/**
 * The blend factor.
 */
export enum BlendFactor {

    /**
     * `1.0`
     */
    ONE,

    /**
     * Source.Alpha, where Source is the color being drawn.
     */
    SRC_ALPHA,

    /**
    * `1.0 - Source.Alpha`, where Source is the color being drawn.
    */
    ONE_MINUS_SRC_ALPHA,
}