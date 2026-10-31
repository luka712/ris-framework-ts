// Unlit material shader (WebGPU). Hand-maintained, mirrors slang/unlit_material.slang and glsl_300_es/unlit_material_*.glsl.
//
// Bind groups (WebGPUUnlitRenderPipeline):
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex)
//   group 1: binding 0 = diffuse texture, binding 1 = sampler (fragment)
//   group 2: binding 2 = material (fragment)

struct Material
{
    diffuseColor : vec4<f32>,
};

@group(0) @binding(0) var<uniform> projectionView : mat4x4<f32>;
@group(0) @binding(1) var<uniform> model : mat4x4<f32>;

@group(1) @binding(0) var diffuseTexture : texture_2d<f32>;
@group(1) @binding(1) var diffuseSampler : sampler;

@group(2) @binding(2) var<uniform> material : Material;

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
    return textureSample(diffuseTexture, diffuseSampler, input.texCoord) * material.diffuseColor * input.color;
}
