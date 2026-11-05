import type {TextureFormat} from "./texture/TextureFormat.ts";

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

/**
 * The color space used to interpret RGB texture components when sampled.
 * sRGB textures are automatically decoded to linear values by the GPU.
 * Alpha is always interpreted as linear.
 */
export enum ColorSpace {
    /** Linear RGB color space. */
    LINEAR = "LINEAR",

    /** sRGB-encoded RGB color space. */
    SRGB = "SRGB",
}
/**
 * The renderer's output color space: how the final image is encoded for the screen (like Three.js `outputColorSpace`).
 * Material shaders always work on the values they sample and never convert gamma themselves; the framework encodes once at the end.
 */
export enum OutputColorSpace
{
    /**
     * sRGB output. The main render target is {@link TextureFormat.RGBA8_UNORM_SRGB}, so shading and blending happen in linear space,
     * and the result is encoded to sRGB once: by the blit shader on WebGL, by the sRGB canvas view on WebGPU.
     * Images that do not specify a color space are loaded as sRGB formats.
     */
    SRGB = "SRGB",

    /**
     * No color management (the default): values are written to the screen as-is. The main render target is {@link TextureFormat.RGBA8_UNORM}, no conversion happens anywhere and
     * images that do not specify a color space are loaded as linear (non-sRGB) formats, so values pass straight through to the screen.
     * Simplest choice for plain 2D games.
     */
    NONE = "NONE",
}
