/*
 * Plain-data types produced by the OBJ loader.
 * This folder is self-contained: files here import only each other, so it can move to its own package.
 */

/** An RGB colour as read from an .mtl file, each channel usually in 0..1. */
export type ObjColor = [r: number, g: number, b: number];

/**
 * A material definition read from an .mtl file (`newmtl` block).
 * This is plain data, not a GPU material; map it onto a framework material yourself.
 */
export class ObjMaterialDefinition {

    /**
     * The constructor.
     * @param name The material name from `newmtl`.
     */
    public constructor(public name: string) {
    }

    /** Ambient colour (`Ka`). */
    public ambientColor?: ObjColor;

    /** Diffuse colour (`Kd`). */
    public diffuseColor?: ObjColor;

    /** Specular colour (`Ks`). */
    public specularColor?: ObjColor;

    /** Emissive colour (`Ke`). */
    public emissiveColor?: ObjColor;

    /** Specular exponent (`Ns`). */
    public specularExponent?: number;

    /** Opacity, from `d`, or `1 - Tr` when only `Tr` is given. */
    public opacity?: number;

    /** Optical density / index of refraction (`Ni`). */
    public opticalDensity?: number;

    /** Illumination model (`illum`). */
    public illuminationModel?: number;

    /**
     * Texture maps by statement name, e.g. `map_Kd`, `map_Ks`, `map_Bump`, `bump`, `disp`, `decal`, `refl`.
     * The value is the file name (last token); map options such as `-bm 1` are kept in {@link mapOptions}.
     */
    public maps: Record<string, string> = {};

    /** Options written before the file name of a map statement, e.g. `{ map_Bump: "-bm 0.5" }`. */
    public mapOptions: Record<string, string> = {};
}

/** A run of triangles in the geometry's index buffer drawn with one material (`usemtl`). */
export interface ObjMaterialRange {
    /** The material name from `usemtl`, or undefined for faces before any `usemtl`. */
    readonly materialName?: string;
    /** First index in `geometry.indices`. */
    readonly indexStart: number;
    /** Number of indices (3 per triangle). */
    readonly indexCount: number;
}

/** The OBJ data exactly as listed in the file, before expansion. */
export interface ObjRawData {
    /** `v` values, 3 per position. */
    readonly positions: number[];
    /** `vt` values, 2 per texture coordinate (a third `w` value is dropped). */
    readonly textureCoords: number[];
    /** `vn` values, 3 per normal. */
    readonly normals: number[];
    /**
     * Triangulated face corners as zero-based `position, texcoord, normal` triplets.
     * A missing texcoord or normal is -1.
     */
    readonly faceIndices: number[];
}

/**
 * Renderable geometry as plain data: one vertex per unique position/texcoord/normal/material corner.
 * Has no dependency on any engine; convert it to engine geometry yourself.
 */
export interface ObjGeometryDefinition {
    /** Positions, 3 per vertex. */
    readonly positions: number[];
    /** Texture coordinates, 2 per vertex (0,0 when the corner has none). */
    readonly textureCoords: number[];
    /** Normals, 3 per vertex (0,0,0 when the corner has none). */
    readonly normals: number[];
    /** RGBA colours, 4 per vertex: the material's `Kd` with alpha from `d`, white without a material. */
    readonly colors: number[];
    /** Triangle indices, 3 per triangle. */
    readonly indices: number[];
    /** Number of vertices (`positions.length / 3`). */
    readonly vertexCount: number;
    /** Index ranges per `usemtl`, in file order. */
    readonly materialRanges: ObjMaterialRange[];
}

/** The result of loading an OBJ file. */
export interface ObjLoadResult {
    /** The renderable geometry as plain data. */
    readonly geometry: ObjGeometryDefinition;
    /** Material definitions from the referenced .mtl files. Empty when there is no `mtllib` or it could not be loaded. */
    readonly materials: ObjMaterialDefinition[];
    /** Library file names from `mtllib`, in order. */
    readonly materialLibraries: string[];
    /** The raw OBJ lists. */
    readonly raw: ObjRawData;
}

/** Options for {@link ObjParser.loadAsync} and `ObjLoader.loadAsync`. */
export interface ObjLoadOptions {
    /**
     * Maps an `mtllib` name to the URL to fetch.
     * By default, the name is resolved relative to the OBJ URL, which fails for `data:` or `blob:` URLs
     * (for example a bundler-inlined asset); use this to point at the real file.
     */
    resolveMaterialUrl?: (libraryName: string) => string;
    /** Skip fetching .mtl files. */
    ignoreMaterials?: boolean;
}

/** One `usemtl` range of an {@link ObjModel}: its index range and resolved material definition. */
export interface ObjSubMesh {
    /** The material name from `usemtl`, or undefined for faces before any `usemtl`. */
    readonly materialName?: string;
    /** The material definition from the .mtl files, or undefined when there is none. */
    readonly material?: ObjMaterialDefinition;
    /** First index in `geometry.indices`. */
    readonly indexStart: number;
    /** Number of indices. */
    readonly indexCount: number;
}

/** A parsed OBJ model (C# `ObjModel`): geometry, sub meshes and material definitions. No GPU resources. */
export interface ObjModel extends ObjLoadResult {
    /** One entry per `usemtl` range, in file order. */
    readonly subMeshes: ObjSubMesh[];
}
