// Shared linear → display conversions. Included once per shader by the WGSL loader.
// WGSL has no overloads, so the scalar sRGB step is linearToSrgbChannel.

fn linearToSrgbChannel(c : f32) -> f32 {
    if (c <= 0.0) {
        return 0.0;
    }
    if (c < 0.0031308) {
        return 12.92 * c;
    }
    if (c < 1.0) {
        return 1.055 * pow(c, 1.0 / 2.4) - 0.055;
    }
    return 1.0;
}

fn linearToSrgb(c : vec3<f32>) -> vec3<f32> {
    return vec3<f32>(
        linearToSrgbChannel(c.r),
        linearToSrgbChannel(c.g),
        linearToSrgbChannel(c.b)
    );
}

// pow(max(c, 0), 1 / gamma). gamma must be greater than zero.
// The blit uniform's gamma is 2.2 by default.
fn linearToGamma(c : vec3<f32>, gamma : f32) -> vec3<f32> {
    return pow(max(c, vec3<f32>(0.0)), vec3<f32>(1.0 / gamma));
}
