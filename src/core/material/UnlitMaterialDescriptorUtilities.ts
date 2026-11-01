import type {IUnlitMaterialDescriptor} from "../../api/material/IUnlitMaterialDescriptor.ts";

/**
 * An unlit material descriptor with every field present. `undefined` means "use the default":
 * the pipeline's default primitive state, and no camera (a placeholder projection view buffer).
 * @internal
 */
export type ResolvedUnlitMaterialDescriptor = { [K in keyof Required<IUnlitMaterialDescriptor>]: IUnlitMaterialDescriptor[K] };

/**
 * Fills in the defaults for every missing field of an unlit material descriptor.
 * @param desc The descriptor, possibly partial or missing.
 * @returns A new descriptor with the defaults applied.
 * @internal
 */
export function resolveUnlitMaterialDescriptor(desc?: IUnlitMaterialDescriptor): ResolvedUnlitMaterialDescriptor {
    return {
        primitiveState: desc?.primitiveState,
        camera: desc?.camera,
    };
}
