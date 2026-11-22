// Inspect texture array shader (WebGPU): draws one layer of a 2D texture array, optionally at an explicit mip level.
// Hand-maintained, mirrors glsl/inspect/inspect_texture_array_*.glsl.
//
// Bind groups (WebGpuInspectTextureArrayRenderPipeline):
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex)
//   group 1: binding 0 = texture array (2d-array view), binding 1 = sampler (fragment)
//   group 2: binding 2 = fragment data (fragment)

struct FragmentData
{
    // 1 to sample at mipLevel, 0 to sample with implicit LOD. Floats only, booleans are stored as 0/1.
    inspectLod : f32,
    layer : f32,
    mipLevel : f32,
    padding : f32,
};

@group(0) @binding(0) var<uniform> projectionView : mat4x4<f32>;
@group(0) @binding(1) var<uniform> model : mat4x4<f32>;

@group(1) @binding(0) var textureArray : texture_2d_array<f32>;
@group(1) @binding(1) var textureSampler : sampler;

@group(2) @binding(2) var<uniform> fragmentData : FragmentData;

struct VertexInput
{
    @location(0) position : vec3<f32>,
    @location(1) color : vec4<f32>,
    @location(2) texCoord : vec2<f32>,
};

struct VertexOutput
{
    @builtin(position) position : vec4<f32>,
    @location(0) color : vec4<f32>,
    @location(1) texCoord : vec2<f32>,
};

@vertex
fn main_vs(input : VertexInput) -> VertexOutput
{
    var output : VertexOutput;
    output.position = projectionView * model * vec4<f32>(input.position, 1.0);
    output.color = input.color;
    output.texCoord = input.texCoord;
    return output;
}

@fragment
fn main_fs(input : VertexOutput) -> @location(0) vec4<f32>
{
    let layer = i32(fragmentData.layer);
    // textureSample needs uniform control flow, so both are sampled and the result is selected.
    // inspectLod > 0.5 samples at mipLevel (matches the GLSL inspect shader); otherwise implicit LOD.
    if(fragmentData.inspectLod > 0.5) {
        return textureSampleLevel(textureArray, textureSampler, input.texCoord, layer, fragmentData.mipLevel) * input.color;
    }
    return textureSample(textureArray, textureSampler, input.texCoord, layer) * input.color;
}
