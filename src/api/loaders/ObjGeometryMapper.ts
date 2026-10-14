import type {GeometryDescriptor} from "../geometry/IGeometryBuilder.ts";
import type {ObjGeometryDefinition} from "./obj/index.ts";

/**
 * Maps plain OBJ geometry definitions from {@link ObjLoader} onto the framework's {@link GeometryDescriptor}.
 * Pass the result to `geometryBuilder.create`.
 */
export class ObjGeometryMapper {

    /**
     * Creates a geometry descriptor from an OBJ geometry definition.
     * @param definition The geometry definition, e.g. `result.geometry` from `ObjLoader.loadAsync`.
     * @param useMaterialColors True keeps the loader's per-vertex `Kd` colours; false (the default) uses white,
     * for when each submesh's material carries the colour instead.
     * @returns The descriptor. It references the definition's arrays; `geometryBuilder.create` copies them.
     */
    public static toDescriptor(definition: ObjGeometryDefinition, useMaterialColors = false): GeometryDescriptor {
        return {
            positions: definition.positions,
            indices: definition.indices,
            normals: definition.normals,
            textureCoords: definition.textureCoords,
            colors: useMaterialColors ? definition.colors : undefined,
        };
    }
}
