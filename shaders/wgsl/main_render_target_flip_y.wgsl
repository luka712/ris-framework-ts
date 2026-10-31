// Draws the main render target texture to the screen, flipped on Y. (WebGPU)
// Hand-maintained, mirrors slang/main_render_target_flip_y.slang.
//
// Bind groups (WebGPUMainFrameBufferRenderPipeline):
//   group 0: binding 0 = texture, binding 1 = sampler (fragment)

@group(0) @binding(0) var diffuseTexture : texture_2d<f32>;
@group(0) @binding(1) var diffuseSampler : sampler;

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
    return textureSample(diffuseTexture, diffuseSampler, vec2<f32>(input.texCoord.x, 1.0 - input.texCoord.y));
}
