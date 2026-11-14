// Unlit material shader (WebGPU). Hand-maintained, mirrors slang/unlit_material.slang and glsl_300_es/unlit_material_*.glsl.
//
// Bind groups (WebGPUUnlitRenderPipeline):
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex), from modules/mesh_vertex.wgsl
//   group 1: binding 0 = diffuse texture, binding 1 = sampler (fragment)
//   group 2: binding 2 = material (fragment)

#include "modules/mesh_vertex.wgsl"

struct Material
{
    diffuseColor : vec4<f32>,
};

@group(1) @binding(0) var diffuseTexture : texture_2d<f32>;
@group(1) @binding(1) var diffuseSampler : sampler;

@group(2) @binding(2) var<uniform> material : Material;

@fragment
fn main_fs(input : VertexOutput) -> @location(0) vec4<f32>
{
    return textureSample(diffuseTexture, diffuseSampler, input.texCoord) * material.diffuseColor * input.color;
}
