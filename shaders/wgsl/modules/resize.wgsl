#include "modules/color_conversion.wgsl"

/// Nearest-neighbor sample of a 2D texture at a source-space position.
///
/// Rounds `srcPos` to the nearest texel and clamps to `[0, srcSize - 1]`.
/// When `srgb` is 1, the loaded texel is decoded to linear light with `srgbToLinear`.
/// Loads mip level 0 of `srcTexture` (the view should already select the source mip).
///
/// @param srcTexture The source texture view.
/// @param srcPos The source-space position (unrounded texel coord).
/// @param srcSize The source view size in pixels.
/// @returns The sampled texel color (linear when `srgb` is 1).
fn resize_nearest(
    srcTexture: texture_2d<f32>,
    srcPos: vec2<f32>,
    srcSize: vec2<f32>
) -> vec4<f32> {
    let coord = vec2<i32>(floor(srcPos + vec2<f32>(0.5)));
    let clampedCoord = clamp(
        coord,
        vec2<i32>(0),
        vec2<i32>(srcSize) - vec2<i32>(1)
    );
    var color = textureLoad(srcTexture, clampedCoord, 0);
    return color;
}
