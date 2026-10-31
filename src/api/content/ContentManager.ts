import {ColorSpace} from "../rendering/enums.ts";
import {
    type IShaderModule,
    type IContentManager,
    type IShaderModuleLoader,
    type ITexture2D,
    type IFramework,
    type ITextureDescriptor,
    TextureFormat,
    ContentConfig,
    TextureUsage,
    type IMesh,
    type IRenderableMesh,
    type GeometryFormat,
    Color,
    type ICamera,
    type IDisposable,
} from "../index.ts";
import {ObjGeometryMapper} from "../loaders/ObjGeometryMapper.ts";
import {ObjLoader} from "../loaders/ObjLoader.ts";
import {Ktx2Factory} from "ris-ktx2";
import {resolveTextureDescriptor} from "../../core/rendering/texture/TextureDescriptorUtilities.ts";
import type {IKtx2Texture} from "ris-ktx2";

const KTX2_EXTENSION = ".ktx2";

/**
 * The content manager.
 * The content manager is responsible for managing the content modules and loading the content with the given asset file path or identifier.
 */
export class ContentManager implements IContentManager {

    private readonly _ktx2Factory = new Ktx2Factory();
    private readonly _ktx2TextureCache: { [key: string]: IKtx2Texture } = {};

    /**
     * The constructor.
     * @param _framework The framework.
     * @param shaderModuleLoader The shader module loader.
     */
    public constructor(private readonly _framework: IFramework, public readonly shaderModuleLoader: IShaderModuleLoader) {
    }

    /** @inheritDoc */
    public async loadKtx2Async(path: string, contentConfig?: ContentConfig): Promise<IKtx2Texture> {

        // it's fine to call it, handled internally if called multiple times.
        await this._ktx2Factory.initializeAsync();

        let ktx2Texture = this._ktx2TextureCache[path];
        if (ktx2Texture) {
            return ktx2Texture;
        }

        ktx2Texture = await this._ktx2Factory.loadAsync(path);
        if (contentConfig?.keepDataCached == true) {
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
            this._ktx2TextureCache[key].delete();
            delete this._ktx2TextureCache[key];
        }
    }

    /** @inheritDoc */
    public loadShaderModule(shaderModuleId: string, keyValueDictionary?: { [id: string]: number }): IShaderModule {
        return this.shaderModuleLoader.load(shaderModuleId, keyValueDictionary);
    }

    /** @inheritDoc */
    public async loadTexture2DAsync(path: string,
                                    textureDescriptor?: ITextureDescriptor,
                                    contentConfig?: ContentConfig,
    ): Promise<ITexture2D> {

        const desc = resolveTextureDescriptor(textureDescriptor);

        // TODO: check texture cache
        if (path.endsWith(KTX2_EXTENSION)) {

            const ktx2Texture = await this.loadKtx2Async(path);
            const tex = this._framework.textureFactory.createFromKtx2(ktx2Texture, desc);
            if (contentConfig?.keepDataCached !== true) {
                ktx2Texture.delete();
            }
            return tex;
        }

        // The descriptor's color space overrides the renderer's; an explicit format overrides both.
        let format = desc.preferredColorSpace
            ? (desc.preferredColorSpace == ColorSpace.SRGB ? TextureFormat.RGBA_8_UNORM_SRGB : TextureFormat.RGBA_8_UNORM)
            : this._framework.renderer.preferredTextureFormat;

        if (desc.textureFormat != TextureFormat.UNDEFINED) {
            format = desc.textureFormat;
        }

        const imageLoader = this._framework.imageLoader;
        const data = await imageLoader.loadAsync(path, contentConfig?.keepDataCached);

        return this._framework.textureFactory.create(
            data.baseWidth, data.baseHeight,
            data.getData(0) as Uint8Array,
            data.channels,
            desc.label ?? path,
            textureDescriptor?.textureUsage ?? (TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_SRC),
            format,
            desc.generateMipmaps
        );
    }

    /** @inheritDoc */
    public loadTexture2DFromPixels(width: number, height: number, pixels: ArrayBuffer): ITexture2D {
        const view = new Uint8Array(pixels);
        // Raw pixels keep the old linear default.
        return this._framework.textureFactory.create(width, height, view, 4, undefined, undefined, TextureFormat.RGBA_8_UNORM);
    }

    /** @inheritDoc */
    public async loadMeshAsync(path: string, geometryFormat: GeometryFormat): Promise<IMesh> {
        const model = await ObjLoader.parseAsync(path, {ignoreMaterials: true});
        const geometry = this._framework.geometryBuilder.create(ObjGeometryMapper.toDescriptor(model.geometry));
        return this._framework.meshFactory.createMesh(geometry, geometryFormat);
    }

    /** @inheritDoc */
    public loadUnlitMeshAsync(path: string, camera?: ICamera): Promise<IRenderableMesh> {
        return this._framework.objLoader.loadAsync(path, subMesh => {
            const material = this._framework.materialFactory.createUnlitMaterial({camera});
            const diffuse = subMesh.material?.diffuseColor ?? [1, 1, 1];
            material.diffuseColor = new Color(diffuse[0], diffuse[1], diffuse[2], subMesh.material?.opacity ?? 1);
            return material;
        });
    }

    /** @inheritDoc */
    public loadBlinnPhongMeshAsync(path: string, camera: ICamera): Promise<IRenderableMesh> {
        if (!camera?.projectionViewBuffer || !camera?.positionBuffer) {
            throw new Error(`loadBlinnPhongMeshAsync("${path}"): the camera has no projectionViewBuffer/positionBuffer. Pass an initialized camera (the camera factory initializes it).`);
        }
        return this._framework.objLoader.loadAsync(path, {
            projectionViewBuffer: camera.projectionViewBuffer,
            cameraPositionBuffer: camera.positionBuffer,
        });
    }
}
