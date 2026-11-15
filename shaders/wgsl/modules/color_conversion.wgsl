
/**
 * Converts a linear RGB channel value to its sRGB representation.
 *
 * Applies the piecewise sRGB transfer function:
 * - Values less than or equal to 0.0 are clamped to 0.0.
 * - Values below 0.0031308 are converted using a linear segment.
 * - Values below 1.0 are converted using a nonlinear power function.
 * - Values greater than or equal to 1.0 are clamped to 1.0.
 *
 * This function is intended for converting linear-light color values
 * into sRGB-encoded values for display or storage.
 *
 * Reference:
 * OpenGL 4.6 Core Specification, Section 17.3.7, Page 513.
 *
 * @param c Linear-light color channel value.
 * @return Corresponding sRGB-encoded channel value.
 */
fn linearToSrgbChannel(c : f32) -> f32
{
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

/**
 * Converts a linear RGB color to its sRGB representation.
 *
 * Applies the linearToSrgb(float) conversion independently
 * to the red, green, and blue channels.
 *
 * Alpha is not processed.
 *
 * Reference:
 * OpenGL 4.6 Core Specification, Section 17.3.7, Page 513.
 *
 * @param c Linear-light RGB color.
 * @return Corresponding sRGB-encoded RGB color.
 */
fn linearToSrgb(c : vec3<f32>) -> vec3<f32>
{
    return vec3<f32>(
        linearToSrgbChannel(c.r),
        linearToSrgbChannel(c.g),
        linearToSrgbChannel(c.b)
    );
}

/**
 * Converts a linear RGB color to gamma-encoded RGB.
 *
 * Applies a power function independently to each color channel:
 * gammaEncoded = pow(max(linearColor, 0.0), 1.0 / gamma).
 *
 * Negative input values are clamped to zero before conversion.
 *
 * This function performs a generic gamma correction and is not
 * equivalent to the sRGB transfer function.
 *
 * @param c Linear-light RGB color.
 * @param gamma Gamma exponent used for encoding. Must be greater than zero.
 * @return Gamma-encoded RGB color.
 */
fn linearToGamma(c : vec3<f32>, gamma : f32) -> vec3<f32>
{
    return pow(max(c, vec3<f32>(0.0)), vec3<f32>(1.0 / gamma));
}


/**
 * Converts an sRGB-encoded channel value to linear light.
 *
 * Applies the piecewise inverse sRGB transfer function:
 * - Values less than or equal to 0.0 are clamped to 0.0.
 * - Values less than or equal to 0.04045 are converted using a linear segment.
 * - Values below 1.0 are converted using a nonlinear power function.
 * - Values greater than or equal to 1.0 are clamped to 1.0.
 *
 * This function is the inverse of linearToSrgbChannel and is intended
 * for converting sRGB-encoded values into linear-light color values before filtering.
 *
 * Reference:
 * OpenGL 4.6 Core Specification, Section 8.24.
 *
 * @param c sRGB-encoded color channel value.
 * @return Corresponding linear-light channel value.
 */
fn srgbToLinearChannel(c : f32) -> f32
{
    if (c <= 0.0) {
        return 0.0;
    }

    if (c <= 0.04045) {
        return c / 12.92;
    }

    if (c < 1.0) {
        return pow((c + 0.055) / 1.055, 2.4);
    }

    return 1.0;
}

/**
 * Converts an sRGB-encoded color to linear light.
 *
 * Applies the srgbToLinearChannel conversion independently
 * to the red, green, and blue channels.
 *
 * Alpha is not processed.
 *
 * Reference:
 * OpenGL 4.6 Core Specification, Section 8.24.
 *
 * @param c sRGB-encoded RGB color.
 * @return Corresponding linear-light RGB color.
 */
fn srgbToLinear(c : vec3<f32>) -> vec3<f32>
{
    return vec3<f32>(
        srgbToLinearChannel(c.r),
        srgbToLinearChannel(c.g),
        srgbToLinearChannel(c.b)
    );
}

