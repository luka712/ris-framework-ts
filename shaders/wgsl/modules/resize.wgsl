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

/// Averages the 2x2 texels around a source-space position.
///
/// Takes the texels at `floor(srcPos)` and its right, bottom and bottom-right neighbours, each clamped to
/// `[0, srcSize - 1]`, and returns their average. For a 2x downsample this is exactly the 4 source pixels
/// covered by the destination pixel.
/// Loads mip level 0 of `srcTexture` (the view should already select the source mip).
///
/// @param srcTexture The source texture view.
/// @param srcPos The source-space position (unrounded texel coord).
/// @param srcSize The source view size in pixels.
/// @returns The average of the 4 texels.
fn resize_bilinear(
    srcTexture: texture_2d<f32>,
    srcPos: vec2<f32>,
    srcSize: vec2<f32>
) -> vec4<f32> {
    let maxCoord = vec2<i32>(srcSize) - vec2<i32>(1);
    let base = vec2<i32>(floor(srcPos));
    let c00 = clamp(base, vec2<i32>(0), maxCoord);
    let c10 = clamp(base + vec2<i32>(1, 0), vec2<i32>(0), maxCoord);
    let c01 = clamp(base + vec2<i32>(0, 1), vec2<i32>(0), maxCoord);
    let c11 = clamp(base + vec2<i32>(1, 1), vec2<i32>(0), maxCoord);

    let sum = textureLoad(srcTexture, c00, 0)
        + textureLoad(srcTexture, c10, 0)
        + textureLoad(srcTexture, c01, 0)
        + textureLoad(srcTexture, c11, 0);
    return sum * 0.25;
}
