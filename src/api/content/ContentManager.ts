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
    Color,
    type ICamera,
    type IMaterial,
    type ObjMaterialDefinition,
    type SubMeshDescriptor,
    type ObjLoadResult,
    type ObjGeometryDefinition,
    type IGeometry,
    type LightsBuffer,
    type Scene,
    type IDisposable,
} from "../index.ts";
import {ObjGeometryMapper} from "../loaders/ObjGeometryMapper.ts";
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

    /**
     * Disposes the cached shader modules (their GL programs) and forgets cached KTX2 data.
     * Called from `Framework.dispose()`.
     */
    public dispose(): void {
        (this.shaderModuleLoader as Partial<IDisposable>).dispose?.();
        for (const key of Object.keys(this._ktx2TextureCache)) {
            delete this._ktx2TextureCache[key];
        }
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
    public async loadMeshAsync(path: string, scene: Scene): Promise<IMesh> {

        const objResult = await this._loadObj(path);
        const geometry = this._createGeometry(objResult.geometry);
        const subMeshes = this._createSubMeshDescriptors(objResult,
            definition => this._createUnlitMaterial(definition, scene.camera));

        return this._framework.meshFactory.createWithSubMeshes(scene, geometry, subMeshes);
    }

    /** @inheritDoc */
    public async loadBlinnPhongMeshAsync(path: string, scene: Scene): Promise<IMesh> {
        // Checked before loading, so a missing camera fails fast.
        const camera = scene.camera;
        if (!camera) {
            throw new Error(`loadBlinnPhongMeshAsync("${path}"): the scene has no camera. Set scene.camera (or pass the scene to createPerspectiveCamera) before loading a Blinn-Phong mesh.`);
        }
        if (!camera.positionBuffer || !camera.projectionViewBuffer) {
            const what = [camera.projectionViewBuffer ? undefined : "projectionViewBuffer", camera.positionBuffer ? undefined : "positionBuffer"]
                .filter(x => x !== undefined).join(" and ");
            throw new Error(`loadBlinnPhongMeshAsync("${path}"): the scene camera has no ${what}. Call camera.initialize() first (the camera factory does).`);
        }
        const objResult = await this._loadObj(path);
        const geometry = this._createGeometry(objResult.geometry);
        const subMeshes = this._createSubMeshDescriptors(objResult,
            definition => this._createBlinnPhongMaterial(definition, camera, scene.__forwardLightsBuffer));

        return this._framework.meshFactory.createWithSubMeshes(scene, geometry, subMeshes);
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
     * @param createMaterial Creates the material for a definition (undefined without `usemtl` or .mtl entry).
     * @returns The submesh descriptors, in file order.
     */
    private _createSubMeshDescriptors(
        objResult: ObjLoadResult,
        createMaterial: (definition: ObjMaterialDefinition | undefined) => IMaterial): SubMeshDescriptor[] {

        const definitionsByName = this._indexMaterialDefinitions(objResult.materials);
        const materialsByName = new Map<string | undefined, IMaterial>();
        const subMeshes: SubMeshDescriptor[] = [];

        for (const range of objResult.geometry.materialRanges) {
            let material = materialsByName.get(range.materialName);
            if (material === undefined) {
                const definition = this._findMaterialDefinition(definitionsByName, range.materialName);
                material = createMaterial(definition);
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
     * @param camera The scene's current camera, or undefined; the scene assigns it on update.
     * @returns The unlit material.
     */
    private _createUnlitMaterial(definition: ObjMaterialDefinition | undefined, camera: ICamera | undefined): IMaterial {
        const material = this._framework.materialFactory.createUnlitMaterial({
            camera: camera,
        });

        const diffuse = definition?.diffuseColor ?? [1, 1, 1];
        const opacity = definition?.opacity ?? 1;
        material.diffuseColor = new Color(diffuse[0], diffuse[1], diffuse[2], opacity);
        return material;
    }

    /**
     * Creates a Blinn-Phong material for an OBJ material definition.
     * `Kd` (with `d` as alpha) becomes the diffuse colour, white when missing.
     * `Ka` becomes the ambient colour; when missing the diffuse colour is used, so ambient light tints by the surface colour.
     * `Ks` and `Ns` become specular colour and shininess; when missing the material defaults stay (0.5 grey, 32).
     * @param definition The material definition, or undefined.
     * @param camera The scene's camera; its projection view and position buffers are bound.
     * @param lightsBuffer The optional lights buffer; the shader is compiled for its light counts.
     * @returns The Blinn-Phong material.
     */
    private _createBlinnPhongMaterial(
        definition: ObjMaterialDefinition | undefined,
        camera: ICamera,
        lightsBuffer: LightsBuffer | undefined): IMaterial {

        const material = this._framework.materialFactory.createForwardBlinnPhongMaterial({
            projectionViewBuffer: camera.projectionViewBuffer,
            cameraPositionBuffer: camera.positionBuffer,
            lightsBuffer: lightsBuffer,
        });
        // Matches the scene camera, so Scene.update() does not rebind.
        material.camera = camera;

        const diffuse = definition?.diffuseColor ?? [1, 1, 1];
        const ambient = definition?.ambientColor ?? diffuse;
        material.diffuseColor = new Color(diffuse[0], diffuse[1], diffuse[2], definition?.opacity ?? 1);
        material.ambientColor = new Color(ambient[0], ambient[1], ambient[2]);
        if (definition?.specularColor) {
            const specular = definition.specularColor;
            material.specularColor = new Color(specular[0], specular[1], specular[2]);
        }
        if (definition?.specularExponent !== undefined) {
            material.shininess = definition.specularExponent;
        }
        return material;
    }
}
