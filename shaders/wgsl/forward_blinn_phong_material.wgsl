// Forward Blinn-Phong material shader (WebGPU): ambient + directional + point lights, per fragment in world space.
// Hand-maintained, mirrors slang/forward_blinn_phong_material.slang and glsl_300_es/forward_blinn_phong_material_*.glsl.
//
// The light counts must match LightsBuffer.DEFAULT_*_LIGHTS_COUNT (3 directional, 5 point lights;
// Lights = 4 + 3 * 8 + 5 * 12 = 88 floats = 352 bytes). Every member is a 16 byte aligned vec4.
// The counts are fixed here because the WebGPU pipeline does not pass a shader config.
//
// Bind groups (WebGPUForwardBlinnPhongRenderPipeline), WebGPU guarantees only 4 groups:
//   group 0: binding 0 = projection view matrix, binding 1 = model matrix (vertex)
//   group 1: binding 0 = diffuse texture, binding 1 = sampler (fragment)
//   group 2: binding 2 = material (fragment)
//   group 3: binding 3 = lights, binding 4 = camera position (fragment)

const DIRECTIONAL_LIGHTS_COUNT : u32 = 3u;
const POINT_LIGHTS_COUNT : u32 = 5u;

// Material colors (MTL Ka, Kd, Ks) and the specular exponent (MTL Ns).
struct BlinnPhongMaterial
{
    ambientColor : vec4<f32>,
    diffuseColor : vec4<f32>,
    specularColorShininess : vec4<f32>, // xyz specular color, w shininess
};

struct DirectionalLight
{
    light : vec4<f32>,     // xyz color * intensity
    direction : vec4<f32>, // xyz direction in which the light travels
};

struct PointLight
{
    lightConstant : vec4<f32>,  // xyz color * intensity, w constant attenuation
    positionLinear : vec4<f32>, // xyz world position, w linear attenuation
    quadratic : vec4<f32>,      // x quadratic attenuation
};

struct Lights
{
    ambientLight : vec4<f32>, // xyz color * intensity
    directionalLights : array<DirectionalLight, DIRECTIONAL_LIGHTS_COUNT>,
    pointLights : array<PointLight, POINT_LIGHTS_COUNT>,
};

struct CameraPosition
{
    position : vec4<f32>, // xyz world-space eye
};

@group(0) @binding(0) var<uniform> projectionView : mat4x4<f32>;
@group(0) @binding(1) var<uniform> model : mat4x4<f32>;

@group(1) @binding(0) var diffuseTexture : texture_2d<f32>;
@group(1) @binding(1) var diffuseSampler : sampler;

@group(2) @binding(2) var<uniform> material : BlinnPhongMaterial;

@group(3) @binding(3) var<uniform> lights : Lights;
@group(3) @binding(4) var<uniform> cameraPosition : CameraPosition;

struct VertexInput
{
    @location(0) position : vec3<f32>,
    @location(1) color : vec4<f32>,
    @location(2) texCoord : vec2<f32>,
    @location(3) normal : vec3<f32>,
};

struct VertexOutput
{
    @builtin(position) position : vec4<f32>,
    @location(0) color : vec4<f32>,
    @location(1) texCoord : vec2<f32>,
    @location(2) normal : vec3<f32>,
    @location(3) worldPosition : vec3<f32>,
};

@vertex
fn main_vs(input : VertexInput) -> VertexOutput
{
    var output : VertexOutput;
    let worldPosition = model * vec4<f32>(input.position, 1.0);
    output.position = projectionView * worldPosition;
    output.color = input.color;
    output.texCoord = input.texCoord;
    output.worldPosition = worldPosition.xyz;

    // World-space normal through the normal matrix (inverse transpose of the upper 3x3 of the model matrix),
    // correct for non-uniform scale. For M = [a b c] (columns) the cofactor matrix is [b x c, c x a, a x b];
    // it equals the inverse transpose times det(M). The length is removed in the fragment shader, only the sign matters.
    let a = model[0].xyz;
    let b = model[1].xyz;
    let c = model[2].xyz;
    let cofactor = mat3x3<f32>(cross(b, c), cross(c, a), cross(a, b));
    let determinantSign = select(1.0, -1.0, dot(a, cross(b, c)) < 0.0);
    output.normal = determinantSign * (cofactor * input.normal);
    return output;
}

fn blinnPhong(normal : vec3<f32>, lightDirection : vec3<f32>, viewDirection : vec3<f32>, lightColor : vec3<f32>,
    diffuse : ptr<function, vec3<f32>>, specular : ptr<function, vec3<f32>>)
{
    let NdotL = max(dot(normal, lightDirection), 0.0);
    *diffuse += material.diffuseColor.xyz * lightColor * NdotL;

    if (NdotL > 0.0)
    {
        let halfway = normalize(lightDirection + viewDirection);
        let NdotH = max(dot(normal, halfway), 0.0);
        *specular += material.specularColorShininess.xyz * lightColor * pow(NdotH, material.specularColorShininess.w);
    }
}

@fragment
fn main_fs(input : VertexOutput) -> @location(0) vec4<f32>
{
    let normal = normalize(input.normal);

    // Ambient lighting.
    let ambient = material.ambientColor.xyz * lights.ambientLight.xyz;

    let viewDirection = normalize(cameraPosition.position.xyz - input.worldPosition);

    // Diffuse and Blinn-Phong specular lighting.
    var diffuse = vec3<f32>(0.0);
    var specular = vec3<f32>(0.0);

    for (var i = 0u; i < DIRECTIONAL_LIGHTS_COUNT; i++)
    {
        let light = lights.directionalLights[i];
        blinnPhong(normal, normalize(-light.direction.xyz), viewDirection, light.light.xyz, &diffuse, &specular);
    }

    // Point lights: same diffuse and specular, scaled by distance attenuation.
    for (var i = 0u; i < POINT_LIGHTS_COUNT; i++)
    {
        let light = lights.pointLights[i];
        let toLight = light.positionLinear.xyz - input.worldPosition;
        let lightDistance = length(toLight);
        let lightDirection = toLight / max(lightDistance, 0.0001);
        let attenuation = 1.0 / (light.lightConstant.w
            + light.positionLinear.w * lightDistance
            + light.quadratic.x * lightDistance * lightDistance);
        blinnPhong(normal, lightDirection, viewDirection, light.lightConstant.xyz * attenuation, &diffuse, &specular);
    }

    // Apply material lighting, texture and vertex color. Specular highlights are not tinted by the texture.
    let texel = textureSample(diffuseTexture, diffuseSampler, input.texCoord) * input.color;
    return vec4<f32>(texel.rgb * (ambient + diffuse) + specular, texel.a);
}
