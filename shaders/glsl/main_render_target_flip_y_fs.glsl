#version 300 es
precision highp float;
in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform int u_colorConversion;

float linearToSrgb(float c)
{
    if (c <= 0.0)
        return 0.0;

    if (c < 0.0031308)
        return 12.92 * c;

    if (c < 1.0)
        return 1.055 * pow(c, 1.0 / 2.4) - 0.055;

    return 1.0;
}

// https://registry.khronos.org/OpenGL/specs/gl/glspec46.core.pdf
// Chapter 17.3.7
// Page 513
vec3 linearToSrgb(vec3 c)
{
    return vec3(
        linearToSrgb(c.r),
        linearToSrgb(c.g),
        linearToSrgb(c.b)
    );
}

void main() 
{
    vec4 color = texture(u_texture, vec2(v_texCoord.x, 1.0 - v_texCoord.y));
    outColor.rgb = color.rgb;
    if(u_colorConversion == 1) {
        outColor.rgb = linearToSrgb(color.rgb);
    }
    outColor.a = color.a;
}