#version 300 es
precision mediump float;
precision mediump sampler2DArray;

in vec4 v_color;
in vec2 v_texCoords;

layout(location = 0) out vec4 o_outputColor;

layout(std140) uniform FragmentDataBuffer {
    float u_inspectLod;
    float u_layer;
    float u_mipLevel;
};

uniform sampler2DArray u_textureArray;

void main() {
    vec3 texArrayCoords = vec3(v_texCoords, u_layer);

    if (u_inspectLod > 0.5) {
        o_outputColor = textureLod(u_textureArray, texArrayCoords, u_mipLevel) * v_color;
    } else {
        o_outputColor = texture(u_textureArray, texArrayCoords) * v_color;
    }
}