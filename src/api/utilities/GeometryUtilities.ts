import {GeometryFormat} from "../geometry/GeometryFormat.ts";

/**
 * The geometry utilities.
 */
export class GeometryUtilities {
    /**
     * Gets the stride of the geometry format.
     * @param geometryFormat The geometry format.
     * @returns The stride in bytes.
     * @throws Error for an unknown geometry format.
     */
    public static stride(geometryFormat: GeometryFormat): number {
        switch (geometryFormat) {
            case GeometryFormat.POS3_COLOR4_TEXTURECOORDS2:
                return (3 + 4 + 2) * Float32Array.BYTES_PER_ELEMENT;
            case GeometryFormat.POS3_COLOR4_TEXTURECOORDS2_NORMAL3:
                return (3 + 4 + 2 + 3) * Float32Array.BYTES_PER_ELEMENT;
            default:
                throw new Error(`GeometryUtilities.stride: Unknown geometryFormat ${geometryFormat}; expected POS3_COLOR4_TEXTURECOORDS2 or POS3_COLOR4_TEXTURECOORDS2_NORMAL3.`);
        }
    }
}