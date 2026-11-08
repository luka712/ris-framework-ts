// Draws the main render target texture to the screen. (WebGPU)
// Hand-maintained.
//
// Bind groups (WebGpuMainRenderTargetRenderPipeline):
//   group 0: binding 0 = texture, binding 1 = sampler, binding 2 = FragmentDataBuffer (fragment)

// Full-line import, optional indent and semicolon. WebGpuShaderModule includes each path once.
#import "modules/color_conversion.wgsl"

@group(0) @binding(0) var diffuseTexture : texture_2d<f32>;
@group(0) @binding(1) var diffuseSampler : sampler;

// std140 / 16 bytes: flipY, colorConversion, gamma, padding.
struct FragmentData {
    flipY : f32,
    colorConversion : f32,
    gamma : f32,
    _pad : f32,
};

@group(0) @binding(2) var<uniform> u_fragmentData : FragmentData;

struct VertexInput
{
    @location(0) position : vec3<f32>,
    @location(1) texCoord : vec2<f32>,
};

struct VertexOutput
{
    @builtin(position) position : vec4<f32>,
    @location(0) texCoord : vec2<f32>,
};

@vertex
fn main_vs(input : VertexInput) -> VertexOutput
{
    var output : VertexOutput;
    output.position = vec4<f32>(input.position, 1.0);
    output.texCoord = input.texCoord;
    return output;
}

@fragment
fn main_fs(input : VertexOutput) -> @location(0) vec4<f32>
{
    var uv = input.texCoord;
    if (u_fragmentData.flipY > 0.5) {
        uv = vec2<f32>(uv.x, 1.0 - uv.y);
    }
    let color = textureSample(diffuseTexture, diffuseSampler, uv);
    if (u_fragmentData.colorConversion > 0.5) {
        return vec4<f32>(linearToGamma(color.rgb, u_fragmentData.gamma), color.a);
    }
    return color;
}
