import {
    type IShaderModule,
    type IContentManager,
    type IShaderModuleLoader,
    type ITexture2D,
    type IFramework,
    TextureDescriptor,
    TextureFormat,
    ContentConfig,
    TextureUsage,
    type IMesh,
    ObjLoader,
    ObjGeometryMapper,
    Color,
    type ICamera,
    type IMaterial,
    type ObjMaterialDefinition,
    type SubMeshDescriptor,
    type ObjLoadResult,
    type ObjGeometryDefinition,
    type IGeometry
} from "../index.ts";
import {Ktx2Factory} from "ris-ktx2";
import type {IKtx2Texture} from "ris-ktx2";

/**
 * The content manager.
 * The content manager is responsible for managing the content modules and loading the content with the given asset file path or identifier.
 */
export class ContentManager implements IContentManager {

    private readonly _ktx2Factory = new Ktx2Factory();
    private readonly _ktx2TextureCache: {[key: string]: IKtx2Texture} = {};
    private readonly _objLoader = new ObjLoader();

    /**
     * The constructor.
     * @param _framework The framework.
     * @param shaderModuleLoader The shader module loader.
     */
    public constructor(private readonly _framework: IFramework, public readonly shaderModuleLoader: IShaderModuleLoader) {
    }

    /** @inheritDoc */
    public async loadKtx2Async(path: string, contentConfig?: ContentConfig): Promise<IKtx2Texture> {

        let ktx2Texture = this._ktx2TextureCache[path];
        if(ktx2Texture) {
            return ktx2Texture;
        }

        ktx2Texture = await this._ktx2Factory.loadAsync(path);
        if(contentConfig?.keepDataCached == true){
            this._ktx2TextureCache[path] = ktx2Texture;
        }
        return ktx2Texture;
    }

    /** @inheritDoc */
    public loadShaderModule(shaderModuleId: string,  keyValueDictionary?: { [id:string]: number}): IShaderModule {
        return this.shaderModuleLoader.load(shaderModuleId,  keyValueDictionary);
    }

    /** @inheritDoc */
    public async loadTexture2DAsync(path: string,
                                    textureDescriptor?: TextureDescriptor,
                                    contentConfig?: ContentConfig,
                                    ): Promise<ITexture2D> {

        if(path.endsWith(".ktx2")) {
            const ktx2Texture = await this.loadKtx2Async(path, contentConfig);
            textureDescriptor = textureDescriptor ?? new TextureDescriptor();
            return this._framework.textureFactory.createFromKtx2(ktx2Texture, textureDescriptor);
        }

        let format =  this._framework.renderer.preferredTextureFormat;

        if(textureDescriptor && textureDescriptor.textureFormat != TextureFormat.UNDEFINED) {
            format = textureDescriptor.textureFormat;
        }

        // TODO: pass texture descriptor
        const imageLoader = this._framework.imageLoader;
        const data = await imageLoader.loadAsync(path, contentConfig?.keepDataCached);
        return this._framework.textureFactory.create(
            data.baseWidth, data.baseHeight,
            data.getData(0) as Uint8Array,
            data.channels,
            undefined,
            TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_SRC,
            format,
            textureDescriptor?.generateMipmaps
            );
    }

    /** @inheritDoc */
    public loadTexture2DFromPixels(width: number, height: number, pixels: ArrayBuffer): ITexture2D {
        const view = new Uint8Array(pixels);
        return this._framework.textureFactory.create(width, height, view);
    }

    /** @inheritDoc */
    public async loadMesh(path: string, camera: ICamera): Promise<IMesh> {
        const objResult = await this._loadObj(path);
        const geometry = this._createGeometry(objResult.geometry);
        const subMeshes = this._createSubMeshDescriptors(objResult, camera);

        return this._framework.meshFactory.createWithSubMeshes(geometry, subMeshes);
    }

    /**
     * Loads the OBJ file and its .mtl material libraries.
     * @param path The path or url to the .obj file.
     * @returns The plain OBJ data.
     */
    private _loadObj(path: string): Promise<ObjLoadResult> {
        return this._objLoader.loadAsync(path);
    }

    /**
     * Creates framework geometry from the OBJ geometry.
     * Vertex colours stay white, because each submesh's material carries the colour.
     * @param definition The OBJ geometry definition.
     * @returns The geometry.
     */
    private _createGeometry(definition: ObjGeometryDefinition): IGeometry {
        const descriptor = ObjGeometryMapper.toDescriptor(definition);
        return this._framework.geometryBuilder.create(descriptor);
    }


    /**
     * Creates one submesh descriptor per material range.
     * Ranges that use the same material name share one material instance.
     * @param objResult The loaded OBJ data.
     * @returns The submesh descriptors, in file order.
     */
    private _createSubMeshDescriptors(objResult: ObjLoadResult, camera: ICamera): SubMeshDescriptor[] {

        const definitionsByName = this._indexMaterialDefinitions(objResult.materials);
        const materialsByName = new Map<string | undefined, IMaterial>();
        const subMeshes: SubMeshDescriptor[] = [];

        for (const range of objResult.geometry.materialRanges) {
            let material = materialsByName.get(range.materialName);
            if (material === undefined) {
                const definition = this._findMaterialDefinition(definitionsByName, range.materialName);
                material =  this._createUnlitMaterial(definition, camera);
                materialsByName.set(range.materialName, material);
            }

            subMeshes.push({
                material: material,
                indexStart: range.indexStart,
                indexCount: range.indexCount,
            });
        }

        return subMeshes;
    }

    /**
     * Indexes material definitions by name.
     * @param definitions The material definitions from the .mtl files.
     * @returns A map from material name to definition.
     */
    private _indexMaterialDefinitions(definitions: ObjMaterialDefinition[]): Map<string, ObjMaterialDefinition> {
        const definitionsByName = new Map<string, ObjMaterialDefinition>();
        for (const definition of definitions) {
            definitionsByName.set(definition.name, definition);
        }
        return definitionsByName;
    }

    /**
     * Finds the definition for a `usemtl` name.
     * @param definitionsByName The definitions by name.
     * @param materialName The material name, or undefined for faces without `usemtl`.
     * @returns The definition, or undefined when there is none.
     */
    private _findMaterialDefinition(
        definitionsByName: Map<string, ObjMaterialDefinition>,
        materialName: string | undefined): ObjMaterialDefinition | undefined {
        if (materialName === undefined) {
            return undefined;
        }
        return definitionsByName.get(materialName);
    }

    /**
     * Creates the default unlit material for an OBJ material definition.
     * The diffuse colour is the definition's `Kd` with `d` as alpha; white when there is no definition.
     * @param definition The material definition, or undefined.
     * @param camera The camera used to render the material.
     * @returns The unlit material.
     */
    private _createUnlitMaterial(definition: ObjMaterialDefinition | undefined, camera: ICamera): IMaterial {
        const material = this._framework.materialFactory.createUnlitMaterial({
            camera: camera,
        });

        const diffuse = definition?.diffuseColor ?? [1, 1, 1];
        const opacity = definition?.opacity ?? 1;
        material.diffuseColor = new Color(diffuse[0], diffuse[1], diffuse[2], opacity);
        return material;
    }
}
