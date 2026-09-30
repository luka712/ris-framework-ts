import {GeometryFormat} from "../geometry/GeometryFormat";

/**
 * The geometry utilities.
 */
export class GeometryUtilities {
    /**
     * Gets the stride of the geometry format.
     * @param geometryFormat The geometry format.
     * @returns The stride.
     */
    public static stride(geometryFormat: GeometryFormat): number {
        switch (geometryFormat) {
            case GeometryFormat.POS3_COLOR4_TEXTURECOORDS2:
                return (3 + 4 + 2) * Float32Array.BYTES_PER_ELEMENT;
            default:
                throw new Error("Unknown geometryFormat");
        }
    }
}