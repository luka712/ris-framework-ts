#ifndef COLOR_CONVERSION
#define COLOR_CONVERSION

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
vec3 linearToSrgb(vec3 c)
{
    return vec3(
        linearToSrgb(c.r),
        linearToSrgb(c.g),
        linearToSrgb(c.b)
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
vec3 linearToGamma(vec3 c, float gamma)
{
    return pow(max(c, vec3(0.0)), vec3(1.0 / gamma));
}

#endif