#version 300 es
precision mediump float;

#include "modules/color_conversion.glsl"

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_texture;

// std140, 16 bytes: u_flipY, u_colorConversion, u_gamma, padding.
layout(std140) uniform FragmentDataBuffer {
    // 1.0 flips the texture vertically (render target to default framebuffer), 0.0 samples as-is.
    lowp float u_flipY;
    // 1.0 encodes linear to sRGB/gamma (output color space SRGB), 0.0 passes through.
    lowp float u_colorConversion;
    // Gamma for the encode. By default, 2.2. Encoding is pow(c, 1.0 / u_gamma).
    float u_gamma;
};

void main()
{
    float y = u_flipY > 0.5 ? 1.0 - v_texCoord.y : v_texCoord.y;
    vec4 color = texture(u_texture, vec2(v_texCoord.x, y));
    outColor = u_colorConversion > 0.5 ? vec4(linearToGamma(color.rgb, u_gamma), color.a) : color;
}
