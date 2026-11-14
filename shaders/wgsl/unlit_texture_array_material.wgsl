// Unlit texture array material shader (WebGPU): samples one layer of a 2D texture array.
// Hand-maintained, mirrors glsl/unlit_texture_array_material_fs.glsl.
//
// Bind groups (WebGpuUnlitTextureArrayRenderPipeline):
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex), from modules/mesh_vertex.wgsl
//   group 1: binding 0 = texture array (2d-array view), binding 1 = sampler (fragment)
//   group 2: binding 2 = material (fragment)

#include "modules/mesh_vertex.wgsl"

struct Material
{
    diffuseColor : vec4<f32>,
    // The array layer to sample. Floats only; truncated to an integer layer.
    layer : f32,
    padding0 : f32,
    padding1 : f32,
    padding2 : f32,
};

@group(1) @binding(0) var diffuseTexture : texture_2d_array<f32>;
@group(1) @binding(1) var diffuseSampler : sampler;

@group(2) @binding(2) var<uniform> material : Material;

@fragment
fn main_fs(input : VertexOutput) -> @location(0) vec4<f32>
{
    let layer = i32(material.layer);
    return textureSample(diffuseTexture, diffuseSampler, input.texCoord, layer) * material.diffuseColor * input.color;
}
