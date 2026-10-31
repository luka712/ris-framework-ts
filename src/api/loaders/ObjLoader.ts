import type {IFramework} from "../IFramework.ts";
import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import {RenderableMesh} from "../meshes/RenderableMesh.ts";
import type {IMaterial} from "../material/IMaterial.ts";
import {ForwardBlinnPhongMaterialDescriptor} from "../material/ForwardBlinnPhongMaterial.ts";
import {Color} from "../data/Color.ts";
import {ObjParser} from "./obj/ObjParser.ts";
import type {ObjLoadOptions, ObjModel, ObjSubMesh} from "./obj/ObjTypes.ts";
import {ObjGeometryMapper} from "./ObjGeometryMapper.ts";

/** Creates the material for one OBJ sub mesh (`usemtl` range). */
export type ObjMaterialFactory = (subMesh: ObjSubMesh) => IMaterial;

/**
 * Loads OBJ (Wavefront) models into renderable meshes (C# `ObjLoader`). Available as `framework.objLoader`.
 *
 * The returned root mesh has no material and owns the vertex and index buffers; each `usemtl` range is a sub mesh
 * with its own material (ranges with the same material name share one material instance).
 * Vertex colours are white, the materials carry the colour. Parsing is done by the engine-independent {@link ObjParser}.
 * @public
 */
export class ObjLoader {

    /** Default specular colour when the .mtl has no `Ks` (0.5 grey). */
    public static readonly DEFAULT_SPECULAR = 0.5;

    /** Default shininess when the .mtl has no `Ns`. */
    public static readonly DEFAULT_SHININESS = 32;

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /**
     * Parses an .obj file (and its .mtl files) into plain data. Creates no GPU resources (C# `ObjLoader.Parse`).
     * @param path The .obj URL.
     * @param options Optional: how to resolve `mtllib` names, or skip materials.
     * @returns The model.
     */
    public static parseAsync(path: string, options?: ObjLoadOptions): Promise<ObjModel> {
        return new ObjParser().parseAsync(path, options);
    }

    /**
     * Loads an .obj file into a renderable mesh with one Blinn-Phong material per `usemtl` range.
     * The .mtl values map onto `ForwardBlinnPhongMaterial`: `Kd` (with `d` as alpha) → diffuse colour (white when missing),
     * `Ka` → ambient colour (falls back to `Kd`), `Ks` → specular colour (0.5 grey), `Ns` → shininess (32).
     * @param path The .obj URL. A relative `mtllib` is resolved against it.
     * @param descriptor The descriptor every material is created with (camera buffers, primitive state).
     * @param options Optional parser options.
     * @returns The root mesh.
     */
    public loadAsync(path: string, descriptor: ForwardBlinnPhongMaterialDescriptor, options?: ObjLoadOptions): Promise<IRenderableMesh>;

    /**
     * Loads an .obj file into a renderable mesh, creating each sub mesh's material with a callback.
     * @param path The .obj URL.
     * @param createMaterial Called once per distinct `usemtl` name.
     * @param options Optional parser options.
     * @returns The root mesh.
     */
    public loadAsync(path: string, createMaterial: ObjMaterialFactory, options?: ObjLoadOptions): Promise<IRenderableMesh>;

    public async loadAsync(path: string,
                           materialSource: ForwardBlinnPhongMaterialDescriptor | ObjMaterialFactory,
                           options?: ObjLoadOptions): Promise<IRenderableMesh> {
        // Validate before fetching, so a bad descriptor fails fast.
        const createMaterial: ObjMaterialFactory = typeof materialSource === "function"
            ? materialSource
            : this._blinnPhongFactory(materialSource);
        const model = await ObjLoader.parseAsync(path, options);
        return this.createMesh(model, createMaterial);
    }

    /**
     * Creates a renderable mesh from a parsed model.
     * @param model The model, e.g. from {@link parseAsync}.
     * @param createMaterial Creates the material per distinct `usemtl` name.
     * @returns The root mesh, without a material, with one sub mesh per range.
     */
    public createMesh(model: ObjModel, createMaterial: ObjMaterialFactory): IRenderableMesh {
        if (model.subMeshes.length == 0) {
            throw new Error("ObjLoader: the model has no faces.");
        }
        const materialsByName = new Map<string | undefined, IMaterial>();
        const materials = model.subMeshes.map(subMesh => {
            let material = materialsByName.get(subMesh.materialName);
            if (!material) {
                material = createMaterial(subMesh);
                materialsByName.set(subMesh.materialName, material);
            }
            return material;
        });
        const format = materials[0].geometryFormat;
        if (materials.some(m => m.geometryFormat != format)) {
            throw new Error("ObjLoader: all materials must use the same geometry format, as the sub meshes share one vertex buffer.");
        }

        const geometry = this._framework.geometryBuilder.create(ObjGeometryMapper.toDescriptor(model.geometry));
        const root = new RenderableMesh(this._framework);
        root.setGeometry(geometry, format);
        model.subMeshes.forEach((subMesh, i) => root.addSubMesh(materials[i], subMesh.indexStart, subMesh.indexCount));
        return root;
    }

    private _blinnPhongFactory(descriptor: ForwardBlinnPhongMaterialDescriptor): ObjMaterialFactory {
        if (!descriptor?.projectionViewBuffer || !descriptor?.cameraPositionBuffer) {
            throw new Error("ObjLoader.loadAsync: the Blinn-Phong descriptor needs projectionViewBuffer and cameraPositionBuffer (e.g. camera.projectionViewBuffer and camera.positionBuffer).");
        }
        return subMesh => {
            const definition = subMesh.material;
            const material = this._framework.materialFactory.createForwardBlinnPhongMaterial(descriptor);
            const diffuse = definition?.diffuseColor ?? [1, 1, 1];
            const ambient = definition?.ambientColor ?? diffuse;
            const specular = definition?.specularColor ?? [ObjLoader.DEFAULT_SPECULAR, ObjLoader.DEFAULT_SPECULAR, ObjLoader.DEFAULT_SPECULAR];
            material.diffuseColor = new Color(diffuse[0], diffuse[1], diffuse[2], definition?.opacity ?? 1);
            material.ambientColor = new Color(ambient[0], ambient[1], ambient[2]);
            material.specularColor = new Color(specular[0], specular[1], specular[2]);
            material.shininess = definition?.specularExponent ?? ObjLoader.DEFAULT_SHININESS;
            return material;
        };
    }
}
