import { ColorSpace } from "../gpu/enums.ts";
import {
    type IShaderModule,
    type IContentManager,
    type IShaderModuleLoader,
    type ITexture2D,
    type IFramework,
    type ITextureDescriptor,
    TextureFormat,
    ContentConfig,
    type IMesh,
    type IRenderableMesh,
    type GeometryFormat,
    Color,
    type ICamera,
    type IDisposable, type ITexture2DArray,
} from "../index.ts";
import { ObjGeometryMapper } from "../loaders/ObjGeometryMapper.ts";
import { ObjLoader } from "../loaders/ObjLoader.ts";
import { Ktx2Factory } from "ris-ktx2";
import type { IKtx2Texture } from "ris-ktx2";

const KTX2_EXTENSION = ".ktx2";


/**
 * The content manager.
 * The content manager is responsible for managing the content modules and loading the content with the given asset file path or identifier.
 */
export class ContentManager implements IContentManager {

    private readonly _ktx2Factory = new Ktx2Factory();
    private readonly _ktx2TextureCache: { [key: string]: IKtx2Texture } = {};
    /** KTX2 containers loaded as texture arrays, with their layer count. Only filled with `keepDataCached`. */
    private readonly _ktx2ArrayCache: { [key: string]: { texture: IKtx2Texture, layers: number } } = {};

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
        for (const key of Object.keys(this._ktx2ArrayCache)) {
            this._ktx2ArrayCache[key].texture.delete();
            delete this._ktx2ArrayCache[key];
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

        // TODO: check texture cache
        if (path.endsWith(KTX2_EXTENSION)) {

            const ktx2Texture = await this.loadKtx2Async(path);
            const tex = this._framework.textureFactory.createFromKtx2(
                ktx2Texture,
                textureDescriptor?.textureFormat,
                textureDescriptor?.preferredColorSpace,
                textureDescriptor?.generateMipmaps);
            if (contentConfig?.keepDataCached !== true) {
                ktx2Texture.delete();
            }
            return tex;
        }

        // The descriptor's color space overrides the renderer's; an explicit format overrides both.
        let format = textureDescriptor?.preferredColorSpace
            ? (textureDescriptor.preferredColorSpace == ColorSpace.SRGB ? TextureFormat.RGBA8_UNORM_SRGB : TextureFormat.RGBA8_UNORM)
            : this._framework.renderer.preferredTextureFormat;

        if (textureDescriptor?.textureFormat && textureDescriptor.textureFormat != TextureFormat.UNDEFINED) {
            format = textureDescriptor.textureFormat;
        }

        const imageLoader = this._framework.imageLoader;
        const data = await imageLoader.loadAsync(path, contentConfig?.keepDataCached);
        
        return this._framework.textureFactory.create({
            width: data.baseWidth,
            height: data.baseHeight,
            data: [data.getData(0) as Uint8Array],
            label: textureDescriptor?.label ?? path,
            textureUsage: textureDescriptor?.textureUsage,
            textureFormat: format,
            generateMipmaps: textureDescriptor?.generateMipmaps ?? false
        });
    }

    /** @inheritDoc */
    public async loadTexture2DArrayAsync(path: string, textureDescriptor?: ITextureDescriptor, contentConfig?: ContentConfig): Promise<ITexture2DArray> {

        // TODO: check texture cache
        if (path.endsWith(KTX2_EXTENSION)) {

            const ktx2Texture = await this.loadKtx2Async(path);
            const tex = this._framework.textureFactory.createFromKtx2(
                ktx2Texture,
                textureDescriptor?.textureFormat,
                textureDescriptor?.preferredColorSpace,
                textureDescriptor?.generateMipmaps);
            if (contentConfig?.keepDataCached !== true) {
                ktx2Texture.delete();
            }
            return tex;
        }

        // The descriptor's color space overrides the renderer's; an explicit format overrides both.
        let format = textureDescriptor?.preferredColorSpace
            ? (textureDescriptor.preferredColorSpace == ColorSpace.SRGB ? TextureFormat.RGBA8_UNORM_SRGB : TextureFormat.RGBA8_UNORM)
            : this._framework.renderer.preferredTextureFormat;

        if (textureDescriptor?.textureFormat && textureDescriptor.textureFormat != TextureFormat.UNDEFINED) {
            format = textureDescriptor.textureFormat;
        }

        const imageLoader = this._framework.imageLoader;
        const data = await imageLoader.loadAsync(path, contentConfig?.keepDataCached);

        return this._framework.textureFactory.createTexture2DArray(
            data.baseWidth, data.baseHeight, 1,
            [[data.getData(0) as Uint8Array]],
            textureDescriptor?.label ?? path,
            textureDescriptor?.textureUsage,
            format,
            textureDescriptor?.generateMipmaps ?? false
        );
    }

    /**
     * Creates a texture from raw RGBA8 pixels. The format is always {@link TextureFormat.RGBA8_UNORM} (linear).
     * @param width The width in pixels.
     * @param height The height in pixels.
     * @param pixels The pixels, 4 bytes per pixel, row by row.
     * @returns The Texture2D.
     */
    public loadTexture2DFromPixels(width: number, height: number, pixels: ArrayBuffer): ITexture2D {
        const view = new Uint8Array(pixels);
        // Raw pixels keep the old linear default.
        return this._framework.textureFactory.create({
            width,
            height,
            data: [view],
            textureFormat: TextureFormat.RGBA8_UNORM
        });
    }

    /** @inheritDoc */
    public async loadMeshAsync(path: string, geometryFormat: GeometryFormat): Promise<IMesh> {
        const model = await ObjLoader.parseAsync(path, { ignoreMaterials: true });
        const geometry = this._framework.geometryBuilder.create(ObjGeometryMapper.toDescriptor(model.geometry));
        return this._framework.meshFactory.createMesh(geometry, geometryFormat);
    }

    /** @inheritDoc */
    public loadUnlitMeshAsync(path: string, camera?: ICamera): Promise<IRenderableMesh> {
        return this._framework.objLoader.loadAsync(path, subMesh => {
            const material = this._framework.materialFactory.createUnlitMaterial({ camera });
            const diffuse = subMesh.material?.diffuseColor ?? [1, 1, 1];
            material.diffuseColor = new Color(diffuse[0], diffuse[1], diffuse[2], subMesh.material?.opacity ?? 1);
            return material;
        });
    }

    /** @inheritDoc */
    public loadBlinnPhongMeshAsync(path: string, camera: ICamera): Promise<IRenderableMesh> {
        if (!camera?.projectionViewBuffer || !camera?.positionBuffer) {
            throw new Error(`ContentManager.loadBlinnPhongMeshAsync("${path}"): the camera has no projectionViewBuffer/positionBuffer. Pass an initialized camera (the camera factory initializes it).`);
        }
        return this._framework.objLoader.loadAsync(path, {
            projectionViewBuffer: camera.projectionViewBuffer,
            cameraPositionBuffer: camera.positionBuffer,
        });
    }
}
