#version 300 es
precision mediump float;

in vec4 v_color;
in vec2 v_texCoords;

layout(location = 0) out vec4 o_outputColor;

uniform sampler2D u_texture;

void main()
{
    o_outputColor = texture(u_texture, v_texCoords) * v_color;
}