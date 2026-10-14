#version 300 es
precision mediump float;

#define DIRECTIONAL_LIGHTS_COUNT ##DIRECTIONAL_LIGHTS_COUNT##

in vec4 v_color;
in vec2 v_texCoords;
in vec3 v_normal;

layout(location = 0) out vec4 o_outputColor;

layout(std140) uniform MaterialBuffer
{
    vec3 u_ambientColor;
    vec3 u_diffuseColor;
};

struct DirectionalLight
{
    vec3 light;
    vec3 direction;
};

layout(std140) uniform LightsBuffer
{
    vec3 u_ambientLight;
    DirectionalLight u_directionalLight[DIRECTIONAL_LIGHTS_COUNT];
};

uniform sampler2D u_texture;

void main()
{
    vec3 normal = normalize(v_normal);

    // Ambient lighting
    vec3 ambient = u_ambientColor * u_ambientLight;

    // Directional diffuse lighting
    vec3 diffuse = vec3(0.0);

    for (int i = 0; i < DIRECTIONAL_LIGHTS_COUNT; ++i)
    {
        vec3 lightColor = u_directionalLight[i].light;
        vec3 lightDirection = normalize(-u_directionalLight[i].direction);

        float NdotL = max(dot(normal, lightDirection), 0.0);

        diffuse += u_diffuseColor * lightColor * NdotL;
    }

    // Apply material lighting, texture, and vertex color
    vec4 texel = texture(u_texture, v_texCoords) * v_color;
    vec3 finalColor = texel.rgb * (ambient + diffuse);

    o_outputColor = vec4(finalColor, texel.a);
}