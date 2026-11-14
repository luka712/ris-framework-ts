// Shared mesh vertex stage (WebGPU) for POS3_COLOR4_TEXTURECOORDS2 geometry, included by unlit_material.wgsl and unlit_texture_array_material.wgsl.
// Mirrors glsl/unlit_material_vs.glsl.
//
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex)

@group(0) @binding(0) var<uniform> projectionView : mat4x4<f32>;
@group(0) @binding(1) var<uniform> model : mat4x4<f32>;

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
