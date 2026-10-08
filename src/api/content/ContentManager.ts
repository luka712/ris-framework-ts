import {
    type IShaderModule,
    type IContentManager,
    type IShaderModuleLoader,
    type ITexture2D,
    type IFramework, TextureDescriptor, TextureFormat, ContentConfig, TextureUsage
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
    public loadShaderModule(shaderModuleId: string): IShaderModule {
        return this.shaderModuleLoader.load(shaderModuleId);
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

}