/**
 * The power preference when it comes to selecting GPU device.
 * @public
 */
export enum PowerPreferenceType {

    /** Browser selects the power preference. */
    DEFAULT = "default",

    /** The low powered device is preferred. Typically, this would be i-GPU. */
    LOW_POWER = "low-power",

    /** The high-powered device is preferred. Typically, this would be d-GPU. */
    HIGH_PERFORMANCE = "high-performance",
}