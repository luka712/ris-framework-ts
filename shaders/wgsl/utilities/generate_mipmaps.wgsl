// Mipmap generation shader (WebGPU): draws one full-screen triangle into mip level N, sampling mip level N - 1 with a linear filter.
// Used by WebGpuMipmapUtilities, once per mip level and array layer.
//
// Bind groups:
//   group 0: binding 0 = source mip level (2d view of one layer and one level), binding 1 = linear sampler (fragment)

@group(0) @binding(0) var sourceTexture : texture_2d<f32>;
@group(0) @binding(1) var sourceSampler : sampler;

struct VertexOutput
{
    @builtin(position) position : vec4<f32>,
    @location(0) texCoord : vec2<f32>,
};

@vertex
fn main_vs(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput
{
    // Vertices (0, 0), (2, 0), (0, 2) in texture space cover the whole target; texture v points down, clip y points up.
    let uv = vec2<f32>(f32((vertexIndex << 1u) & 2u), f32(vertexIndex & 2u));
    var output : VertexOutput;
    output.position = vec4<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, 0.0, 1.0);
    output.texCoord = uv;
    return output;
}

@fragment
fn main_fs(input : VertexOutput) -> @location(0) vec4<f32>
{
    return textureSampleLevel(sourceTexture, sourceSampler, input.texCoord, 0.0);
}
