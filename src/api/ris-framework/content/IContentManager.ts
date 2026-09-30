import {IShaderModuleLoader} from "../shader/IShaderModuleLoader";
import {IShaderModule} from "../shader/IShaderModule";
import {ITexture2D} from "../rendering/texture/ITexture2D";
import {TextureDescriptor} from "../rendering/texture/TextureDescriptor";
import {ContentConfig} from "./ContentConfig";
import {IKtx2Texture} from "ris-ktx2-api";

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
     * @returns The .
     */
    loadShaderModule(shaderAssetId: string): IShaderModule;

    /**
     * Loads a texture2D.
     * @param path - The file path to the texture.
     * @param desc - The texture descriptor.
     * @param contentConfig - The content config.
     * @returns The Texture2D.
     */
    loadTexture2DAsync(path: string, desc?: TextureDescriptor, contentConfig?: ContentConfig): Promise<ITexture2D>;
}
