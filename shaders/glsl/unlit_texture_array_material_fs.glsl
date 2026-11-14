#version 300 es
precision mediump float;
precision mediump sampler2DArray;

in vec4 v_color;
in vec2 v_texCoords;

layout(location = 0) out vec4 o_outputColor;

layout(std140) uniform MaterialBuffer
{
    vec4 diffuseColor;
    // The array layer to sample. Floats only; truncated to an integer layer.
    float layer;
};

uniform sampler2DArray u_textureArray;

void main()
{
    vec3 texArrayCoords = vec3(v_texCoords, floor(layer));
    o_outputColor = texture(u_textureArray, texArrayCoords) * v_color * diffuseColor;
}
