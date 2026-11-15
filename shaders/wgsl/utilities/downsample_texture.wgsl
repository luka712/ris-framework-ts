// Downsample a 2D texture mip level into a storage texture (WebGPU compute).
// Used by WebGpuDownsampleTextureComputePipeline to downsample one texture into another,
// and to generate mipmaps, once per destination level and array layer.
//
// Bind groups:
//   group 0: binding 0 = source mip (2d view of one layer and one level),
//            binding 1 = destination mip (rgba8unorm storage 2d view of one layer and one level),
//            binding 2 = DownsampleParams uniform.
//
// sRGB: rgba8unorm-srgb cannot be a storage texture, so both views are rgba8unorm (raw stored bytes).
// When params.srgb is 1, samples are decoded with srgbToLinear and the result is
// encoded with linearToSrgb before textureStore, so the downsample happens in linear space.

#include "modules/color_conversion.wgsl"
#include "modules/resize.wgsl"

struct DownsampleParams {
    srcSize: vec2<f32>,
    dstSize: vec2<f32>,
    // If 1 we are using srgb source
    srgb: f32, // 0 = linear, 1 = sRGB
};

@group(0) @binding(0)
var srcTexture: texture_2d<f32>;

@group(0) @binding(1)
var dstTexture: texture_storage_2d<rgba8unorm, write>;

@group(0) @binding(2)
var<uniform> params: DownsampleParams;

@compute @workgroup_size(8, 8, 1)
fn main(
    @builtin(global_invocation_id) globalId: vec3<u32>
) {
    let dstCoord = globalId.xy;

    // u32 vs f32 is a WGSL type error; compare in u32 after converting the destination size.
    if (dstCoord.x >= u32(params.dstSize.x) ||
        dstCoord.y >= u32(params.dstSize.y)) {
        return;
    }

    // Map destination pixel center to source coordinates.
    let scale = params.srcSize / params.dstSize;
    let srcPos = (vec2<f32>(dstCoord) + 0.5) * scale - 0.5;

    var color = resize_nearest(srcTexture, srcPos, params.srcSize);

    if (params.srgb >= 0.5) {
        color = vec4<f32>(srgbToLinear(color.rgb), color.a);
    }

    textureStore(
        dstTexture,
        vec2<i32>(dstCoord),
        color
    );
}
