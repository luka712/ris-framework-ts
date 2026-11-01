// Inspect texture mips shader (WebGPU): draws a texture at an explicit mip level.
// Hand-maintained, mirrors slang/inspect_texture_mips.slang and glsl_300_es/inspect_texture_mips_*.glsl.
// Note: there is no WebGPU inspect pipeline yet; the layout follows the mesh pipelines.
//
// Bind groups:
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex)
//   group 1: binding 0 = texture, binding 1 = sampler (fragment)
//   group 2: binding 2 = texture constants (fragment)

struct TextureConstants
{
    mipLevel : f32,
};

@group(0) @binding(0) var<uniform> projectionView : mat4x4<f32>;
@group(0) @binding(1) var<uniform> model : mat4x4<f32>;

@group(1) @binding(0) var diffuseTexture : texture_2d<f32>;
@group(1) @binding(1) var diffuseSampler : sampler;

@group(2) @binding(2) var<uniform> textureConstants : TextureConstants;

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
    return textureSampleLevel(diffuseTexture, diffuseSampler, input.texCoord, textureConstants.mipLevel) * input.color;
}
