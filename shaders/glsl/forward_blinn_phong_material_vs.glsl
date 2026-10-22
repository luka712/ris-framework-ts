#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in vec2 a_texCoord;
layout(location = 3) in vec3 a_normal;

out vec4 v_color;
out vec2 v_texCoords;
out vec3 v_normal;
out vec3 v_worldPosition;

layout(std140) uniform CameraBuffer
{
	mat4 projectionView;
};

layout(std140) uniform ModelBuffer
{
    mat4 model;
};

void main()
{
    vec4 worldPosition = model * vec4(a_position, 1.0);
	gl_Position = projectionView * worldPosition;
	v_color = a_color;
	v_texCoords = a_texCoord;
    // World-space normal through the normal matrix, correct for non-uniform mesh scale.
    v_normal = transpose(inverse(mat3(model))) * a_normal;
    v_worldPosition = worldPosition.xyz;
}
