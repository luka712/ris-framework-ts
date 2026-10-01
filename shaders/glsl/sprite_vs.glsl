#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec4 a_color;
layout(location = 2) in vec2 a_texCoord;

out vec4 v_color;
out vec2 v_texCoords;

layout(std140) uniform CameraBuffer
{
	mat4 u_projectionView;
};

void main()
{
	gl_Position = u_projectionView * vec4(a_position, 1.0);
	v_color = a_color;
	v_texCoords = a_texCoord;
}