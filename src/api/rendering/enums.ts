
/**
 * The culling mode.
 */
export enum Culling {
    /**
     * The culling is disabled. Both front and back faces will be rendered.
     */
    None,

    /**
     * The back faces will be culled. Only front faces will be rendered.
     */
    Back,

    /**
     * The front faces will be culled. Only back faces will be rendered.
     */
    Front
}

/** The color space. */
export enum ColorSpace
{
    /** The linear color space. */
    LINEAR = "LINEAR",

    /** The sRGB color space. */
    SRGB = "SRGB",
}