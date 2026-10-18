import {
    ObjMaterialDefinition,
    type ObjColor,
    type ObjLoadResult,
    type ObjLoadOptions,
    type ObjMaterialRange,
} from "./ObjTypes.ts";

function tokens(line: string): string[] {
    return line.trim().split(/\s+/);
}

function readColor(parts: string[]): ObjColor | undefined {
    // "Kd spectral ..." and "Kd xyz ..." are not supported.
    if (parts.length < 2 || isNaN(parseFloat(parts[1]))) {
        return undefined;
    }
    const r = parseFloat(parts[1]);
    const g = parts.length > 2 ? parseFloat(parts[2]) : r;
    const b = parts.length > 3 ? parseFloat(parts[3]) : r;
    return [r, g, b];
}

/**
 * Loads .obj models (and their .mtl materials) from text or a URL into plain data.
 * Engine-independent; uses only `fetch` and `URL`. Use `ObjGeometryMapper` to get framework geometry.
 */
export class ObjLoader {

    /**
     * Parses .mtl text.
     * @param text The .mtl contents.
     * @returns The material definitions, in file order.
     */
    public parseMtl(text: string): ObjMaterialDefinition[] {
        const materials: ObjMaterialDefinition[] = [];
        let current: ObjMaterialDefinition | undefined;

        for (const rawLine of text.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (line.length == 0 || line.startsWith("#")) {
                continue;
            }
            const parts = tokens(line);
            const keyword = parts[0];

            if (keyword == "newmtl") {
                current = new ObjMaterialDefinition(line.substring(keyword.length).trim());
                materials.push(current);
                continue;
            }
            if (!current) {
                continue;
            }

            switch (keyword) {
                case "Ka":
                    current.ambientColor = readColor(parts);
                    break;
                case "Kd":
                    current.diffuseColor = readColor(parts);
                    break;
                case "Ks":
                    current.specularColor = readColor(parts);
                    break;
                case "Ke":
                    current.emissiveColor = readColor(parts);
                    break;
                case "Ns":
                    current.specularExponent = parseFloat(parts[1]);
                    break;
                case "Ni":
                    current.opticalDensity = parseFloat(parts[1]);
                    break;
                case "illum":
                    current.illuminationModel = parseInt(parts[1]);
                    break;
                case "d":
                    current.opacity = parseFloat(parts[parts.length - 1]);
                    break;
                case "Tr":
                    // "d" wins when both are present.
                    if (current.opacity === undefined) {
                        current.opacity = 1 - parseFloat(parts[1]);
                    }
                    break;
                default:
                    if (keyword.startsWith("map_") || keyword == "bump" || keyword == "disp"
                        || keyword == "decal" || keyword == "refl" || keyword == "norm") {
                        if (parts.length >= 2) {
                            current.maps[keyword] = parts[parts.length - 1];
                            if (parts.length > 2) {
                                current.mapOptions[keyword] = parts.slice(1, -1).join(" ");
                            }
                        }
                    }
                    break;
            }
        }

        return materials;
    }

    /**
     * Parses .obj text.
     * @param text The .obj contents.
     * @param materials Material definitions to use for `usemtl`, e.g. from {@link parseMtl}. Default none.
     * @returns The geometry, materials and raw data.
     */
    public fromText(text: string, materials: ObjMaterialDefinition[] = []): ObjLoadResult {
        const rawPositions: number[] = [];
        const rawTextureCoords: number[] = [];
        const rawNormals: number[] = [];
        const faceIndices: number[] = [];
        const materialLibraries: string[] = [];
        const materialRanges: ObjMaterialRange[] = [];

        const positions: number[] = [];
        const textureCoords: number[] = [];
        const normals: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];
        const vertexLookup = new Map<string, number>();

        const materialsByName = new Map(materials.map(m => [m.name, m]));
        let materialName: string | undefined;
        let rangeStart = 0;

        const closeRange = () => {
            if (indices.length > rangeStart) {
                materialRanges.push({materialName, indexStart: rangeStart, indexCount: indices.length - rangeStart});
            }
            rangeStart = indices.length;
        };

        const resolve = (value: string | undefined, count: number): number => {
            if (value === undefined || value.length == 0) {
                return -1;
            }
            const index = parseInt(value);
            // OBJ indices are one-based; negative values count back from the end.
            return index < 0 ? count + index : index - 1;
        };

        const addCorner = (p: number, t: number, n: number): void => {
            faceIndices.push(p, t, n);
            const key = `${p}/${t}/${n}/${materialName ?? ""}`;
            let vertex = vertexLookup.get(key);
            if (vertex === undefined) {
                vertex = positions.length / 3;
                vertexLookup.set(key, vertex);
                positions.push(rawPositions[p * 3], rawPositions[p * 3 + 1], rawPositions[p * 3 + 2]);
                textureCoords.push(t >= 0 ? rawTextureCoords[t * 2] : 0, t >= 0 ? rawTextureCoords[t * 2 + 1] : 0);
                normals.push(n >= 0 ? rawNormals[n * 3] : 0, n >= 0 ? rawNormals[n * 3 + 1] : 0, n >= 0 ? rawNormals[n * 3 + 2] : 0);
                const material = materialName !== undefined ? materialsByName.get(materialName) : undefined;
                const kd = material?.diffuseColor ?? [1, 1, 1];
                colors.push(kd[0], kd[1], kd[2], material?.opacity ?? 1);
            }
            indices.push(vertex);
        };

        for (const rawLine of text.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (line.length == 0 || line.startsWith("#")) {
                continue;
            }
            const parts = tokens(line);

            switch (parts[0]) {
                case "v":
                    rawPositions.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                    break;
                case "vt":
                    rawTextureCoords.push(parseFloat(parts[1]), parts.length > 2 ? parseFloat(parts[2]) : 0);
                    break;
                case "vn":
                    rawNormals.push(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                    break;
                case "f": {
                    const corners = parts.slice(1).map(corner => {
                        const [p, t, n] = corner.split("/");
                        return [
                            resolve(p, rawPositions.length / 3),
                            resolve(t, rawTextureCoords.length / 2),
                            resolve(n, rawNormals.length / 3),
                        ];
                    });
                    // Triangulate polygons as a fan.
                    for (let i = 1; i + 1 < corners.length; i++) {
                        addCorner(corners[0][0], corners[0][1], corners[0][2]);
                        addCorner(corners[i][0], corners[i][1], corners[i][2]);
                        addCorner(corners[i + 1][0], corners[i + 1][1], corners[i + 1][2]);
                    }
                    break;
                }
                case "mtllib":
                    materialLibraries.push(...parts.slice(1));
                    break;
                case "usemtl":
                    closeRange();
                    materialName = line.substring(parts[0].length).trim();
                    break;
            }
        }
        closeRange();

        if(positions.length == 0){
            throw new Error("Invalid obj file.");
        }

        return {
            geometry: {
                positions, textureCoords, normals, colors, indices,
                vertexCount: positions.length / 3,
                materialRanges,
            },
            materials,
            materialLibraries,
            raw: {positions: rawPositions, textureCoords: rawTextureCoords, normals: rawNormals, faceIndices},
        };
    }

    /**
     * Loads an .obj file and the .mtl files it references with `mtllib`.
     * A missing or failing .mtl is skipped (logged as a warning); the model still loads with white vertex colours.
     * @param filePath The .obj URL.
     * @param options Optional: how to resolve `mtllib` names, or skip materials.
     * @returns The geometry, materials and raw data.
     */
    public async loadAsync(filePath: string, options?: ObjLoadOptions): Promise<ObjLoadResult> {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load OBJ '${filePath}': ${response.status} ${response.statusText}`);
        }
        const text = await response.text();

        const materials: ObjMaterialDefinition[] = [];

        const libraries = options?.ignoreMaterials ? [] : text.split(/\r?\n/)
            .map(line => tokens(line))
            .filter(parts => parts[0] == "mtllib")
            .flatMap(parts => parts.slice(1));

        // data: and blob: URLs have no directory, so relative names cannot be resolved against them.
        const opaqueUrl = /^(data|blob):/i.test(filePath);
        for (const library of libraries) {
            try {
                let mtlUrl: string;
                if (options?.resolveMaterialUrl) {
                    mtlUrl = options.resolveMaterialUrl(library);
                } else if (opaqueUrl) {
                    throw new Error("the OBJ was loaded from a data: or blob: URL (e.g. a bundler-inlined asset), so the name cannot be resolved; pass options.resolveMaterialUrl");
                } else {
                    mtlUrl = filePath.substring(0, filePath.lastIndexOf("/") + 1) + library;
                }
                const mtlResponse = await fetch(mtlUrl);

                if (!mtlResponse.ok) {
                    throw new Error(`${mtlResponse.status} ${mtlResponse.statusText}`);
                }
                materials.push(...this.parseMtl(await mtlResponse.text()));
            } catch (error) {
                console.warn(`ObjLoader: could not load material library '${library}'.`, error);
            }
        }


        return this.fromText(text, materials);
    }
}
