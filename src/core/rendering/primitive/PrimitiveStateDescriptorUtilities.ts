import {CullMode, FrontFace, type IPrimitiveStateDescriptor, PrimitiveTopology} from "../../../api/index.ts";

/**
 * A primitive state descriptor with all defaults applied.
 * @internal
 */
export type ResolvedPrimitiveStateDescriptor = Required<IPrimitiveStateDescriptor>;

/**
 * Fills in the defaults for every missing field of a primitive state descriptor:
 * TRIANGLE_LIST topology, BACK culling and CCW front face.
 * @param desc The descriptor, possibly partial or missing.
 * @returns A new descriptor with the defaults applied.
 * @internal
 */
export function resolvePrimitiveStateDescriptor(desc?: IPrimitiveStateDescriptor): ResolvedPrimitiveStateDescriptor {
    return {
        topology: desc?.topology ?? PrimitiveTopology.TRIANGLE_LIST,
        cullFace: desc?.cullFace ?? CullMode.BACK,
        frontFace: desc?.frontFace ?? FrontFace.CCW,
    };
}
