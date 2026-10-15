#version 300 es
precision mediump float;

#define DIRECTIONAL_LIGHTS_COUNT ##DIRECTIONAL_LIGHTS_COUNT##
#define POINT_LIGHTS_COUNT ##POINT_LIGHTS_COUNT##

in vec4 v_color;
in vec2 v_texCoords;
in vec3 v_normal;
in vec3 v_worldPosition;

layout(location = 0) out vec4 o_outputColor;

layout(std140) uniform MaterialBuffer
{
    vec3 u_ambientColor;
    vec3 u_diffuseColor;
    vec3 u_specularColor;
    float u_shininess;
};

layout(std140) uniform CameraPositionBuffer
{
    vec3 u_cameraPosition;
};

struct DirectionalLight
{
    vec3 light;
    vec3 direction;
};

struct PointLight
{
    vec3 light;
    float constant;
    vec3 position;
    float linear;
    float quadratic;
};

layout(std140) uniform LightsBuffer
{
    vec3 u_ambientLight;
    DirectionalLight u_directionalLight[DIRECTIONAL_LIGHTS_COUNT];
    PointLight u_pointLight[POINT_LIGHTS_COUNT];
};

uniform sampler2D u_texture;

void main()
{
    vec3 normal = normalize(v_normal);

    // Ambient lighting
    vec3 ambient = u_ambientColor * u_ambientLight;

    vec3 viewDirection = normalize(u_cameraPosition - v_worldPosition);

    // Directional diffuse and Blinn-Phong specular lighting
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);

    for (int i = 0; i < DIRECTIONAL_LIGHTS_COUNT; ++i)
    {
        vec3 lightColor = u_directionalLight[i].light;
        vec3 lightDirection = normalize(-u_directionalLight[i].direction);

        float NdotL = max(dot(normal, lightDirection), 0.0);

        diffuse += u_diffuseColor * lightColor * NdotL;

        if (NdotL > 0.0)
        {
            vec3 halfway = normalize(lightDirection + viewDirection);
            float NdotH = max(dot(normal, halfway), 0.0);
            specular += u_specularColor * lightColor * pow(NdotH, u_shininess);
        }
    }

    // Point lights: same diffuse and specular, scaled by distance attenuation.
    for (int i = 0; i < POINT_LIGHTS_COUNT; ++i)
    {
        vec3 toLight = u_pointLight[i].position - v_worldPosition;
        float lightDistance = length(toLight);
        vec3 lightDirection = toLight / max(lightDistance, 0.0001);
        float attenuation = 1.0 / (u_pointLight[i].constant
            + u_pointLight[i].linear * lightDistance
            + u_pointLight[i].quadratic * lightDistance * lightDistance);
        vec3 lightColor = u_pointLight[i].light * attenuation;

        float NdotL = max(dot(normal, lightDirection), 0.0);

        diffuse += u_diffuseColor * lightColor * NdotL;

        if (NdotL > 0.0)
        {
            vec3 halfway = normalize(lightDirection + viewDirection);
            float NdotH = max(dot(normal, halfway), 0.0);
            specular += u_specularColor * lightColor * pow(NdotH, u_shininess);
        }
    }

    // Apply material lighting, texture, and vertex color
    vec4 texel = texture(u_texture, v_texCoords) * v_color;
    // Specular highlights are not tinted by the texture.
    vec3 finalColor = texel.rgb * (ambient + diffuse) + specular;

    o_outputColor = vec4(finalColor, texel.a);
}