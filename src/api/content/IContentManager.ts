import type { IShaderModuleLoader } from "../shader/IShaderModuleLoader.ts";
import type { IShaderModule } from "../shader/IShaderModule.ts";
import type { ITexture2D } from "../rendering/texture/ITexture2D.ts";
import {TextureDescriptor} from "../rendering/texture/TextureDescriptor.ts";
import {ContentConfig} from "./ContentConfig.ts";
import type { IKtx2Texture } from "ris-ktx2";
import type {IMesh} from "../meshes/IMesh.ts";
import type {ICamera} from "../camera/ICamera.ts";

/**
 * The content manager.
 */
export interface IContentManager {

    /**
     * The shader module loader.
     */
    readonly shaderModuleLoader: IShaderModuleLoader;

    /**
     * Loads a KTX2 container.
     * @param path - The path to the ktx2 asset.
     * @param config - The content configuration.
     * @returns The ktx2 texture.
     */
    loadKtx2Async(path: string, config?: ContentConfig): Promise<IKtx2Texture>;

    /**
     * Loads a shader module.
     * @param shaderAssetId - The id of a shader asset.
     * @param keyValueDictionary - If present, tries to find key in shader such that it replaced ##DIRECTIONAL_LIGHT_COUNT## by given value for key DIRECTIONAL_LIGHST_COUNT.
     * @returns The shader module.
     */
    loadShaderModule(shaderAssetId: string, keyValueDictionary?: { [id:string]: number}): IShaderModule;

    /**
     * Loads a texture2D.
     * @param path - The file path to the texture.
     * @param desc - The texture descriptor.
     * @param contentConfig - The content config.
     * @returns The Texture2D.
     */
    loadTexture2DAsync(path: string, desc?: TextureDescriptor, contentConfig?: ContentConfig): Promise<ITexture2D>;

    /**
     * Loads a mesh from a model, typically.
     * Currently, OBJ(WAVEFRONT) is supported.
     * The mesh has one submesh per `usemtl` range, all sharing one vertex and index buffer.
     * By default each submesh gets an unlit material with the .mtl `Kd` as diffuse colour and `d` as alpha.
     * Draw it through `mesh.subMeshes`.
     * @param path The path or url to the model.
     * @param camera The camera used to render the materials.
     * @return The mesh.
     */
    loadMesh(path: string, camera: ICamera): Promise<IMesh>;

}
