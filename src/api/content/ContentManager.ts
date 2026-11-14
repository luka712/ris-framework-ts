import { ColorSpace } from "../rendering/enums.ts";
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
    type IDisposable, type ITexture2DArray,
} from "../index.ts";
import { ObjGeometryMapper } from "../loaders/ObjGeometryMapper.ts";
import { ObjLoader } from "../loaders/ObjLoader.ts";
import { Ktx2Factory } from "ris-ktx2";
import type { IKtx2Texture } from "ris-ktx2";

const KTX2_EXTENSION = ".ktx2";

/** The 12-byte KTX2 file identifier: `«KTX 20»\r\n\x1A\n`. */
const KTX2_IDENTIFIER = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x32, 0x30, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
/** Byte offsets of the KTX2 header fields read for texture arrays (all little-endian uint32). */
const KTX2_PIXEL_DEPTH_OFFSET = 28;
const KTX2_LAYER_COUNT_OFFSET = 32;
const KTX2_FACE_COUNT_OFFSET = 36;

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
                textureDescriptor?.preferredColorSpace);
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

        return this._framework.textureFactory.create(
            data.baseWidth, data.baseHeight,
            data.getData(0) as Uint8Array,
            4,
            textureDescriptor?.label ?? path,
            textureDescriptor?.textureUsage ?? (TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_SRC),
            format,
            textureDescriptor?.generateMipmaps ?? false
        );
    }

    /** @inheritDoc */
    public async loadTexture2DArrayAsync(filePaths: string[] | string, textureDescriptor?: ITextureDescriptor, contentConfig?: ContentConfig): Promise<ITexture2DArray> {

        if(filePaths instanceof Array) {

            if (filePaths.length == 0) {
                throw new Error(`ContentManager.loadTexture2DArrayAsync: filePaths is empty; pass at least one file path (one per layer).`);
            }

            // The descriptor's color space overrides the renderer's; an explicit format overrides both.
            let format = textureDescriptor?.preferredColorSpace
                ? (textureDescriptor.preferredColorSpace == ColorSpace.SRGB ? TextureFormat.RGBA8_UNORM_SRGB : TextureFormat.RGBA8_UNORM)
                : this._framework.renderer.preferredTextureFormat;

            if (textureDescriptor?.textureFormat && textureDescriptor.textureFormat != TextureFormat.UNDEFINED) {
                format = textureDescriptor.textureFormat;
            }

            const imageLoader = this._framework.imageLoader;
            const data = [];
            for(const filePath of filePaths) {
                data.push(await imageLoader.loadAsync(filePath, contentConfig?.keepDataCached));
            }

            const width = data[0].baseWidth;
            const height = data[0].baseHeight;

            const diffIndex = data.findIndex(x => x.baseWidth != width || x.baseHeight != height);
            if(diffIndex >= 0) {
                const diff = data[diffIndex];
                throw new Error(`ContentManager.loadTexture2DArrayAsync: all texture array layers must be ${width}x${height} (the size of "${filePaths[0]}"); layer ${diffIndex} "${filePaths[diffIndex]}" is ${diff.baseWidth}x${diff.baseHeight}.`);
            }

            // One layer per file, with mip level 0 only. The image loader returns HTMLImageElements in the browser.
            const dataPerLayerPerMip = data.map(image => [image.getData(0)]) as Uint8Array[][] | HTMLImageElement[][];


            return this._framework.textureFactory.createTexture2DArray(
                width, height, data.length,
                dataPerLayerPerMip,
                textureDescriptor?.label ?? filePaths[0],
                // WebGPU copies the images with copyExternalImageToTexture, which needs COPY_DST and RENDER_ATTACHMENT.
                textureDescriptor?.textureUsage ?? (TextureUsage.TEXTURE_BINDING | TextureUsage.COPY_DST | TextureUsage.RENDER_ATTACHMENT),
                format,
                textureDescriptor?.generateMipmaps ?? false
            );
        }

        const filePath = filePaths;
        if (filePath.endsWith(KTX2_EXTENSION)) {

            const { texture: ktx2Texture, layers } = await this._loadKtx2ArrayAsync(filePath, contentConfig);
            try {
                return this._framework.textureFactory.createTexture2DArrayFromKtx2(
                    ktx2Texture,
                    layers,
                    textureDescriptor?.textureFormat,
                    textureDescriptor?.preferredColorSpace,
                    textureDescriptor?.label ?? filePath,
                    textureDescriptor?.generateMipmaps);
            } finally {
                if (contentConfig?.keepDataCached !== true) {
                    ktx2Texture.delete();
                }
            }
        }

        // A single image file becomes a one-layer array.
        return this.loadTexture2DArrayAsync([filePath], textureDescriptor, contentConfig);
    }

    /**
     * Loads a KTX2 container and reads its layer count from the file header.
     * With `keepDataCached`, the container is cached by path and returned on later loads.
     * @param path The path to the .ktx2 file.
     * @param contentConfig The content config.
     * @returns The ktx2 texture and its layer count (1 for a non-array file).
     * @throws Error when the file cannot be fetched, is not a KTX2 file, or is a cube map or 3D texture.
     * @private
     */
    private async _loadKtx2ArrayAsync(path: string, contentConfig?: ContentConfig): Promise<{ texture: IKtx2Texture, layers: number }> {

        // it's fine to call it, handled internally if called multiple times.
        await this._ktx2Factory.initializeAsync();

        const cached = this._ktx2ArrayCache[path];
        if (cached) {
            return cached;
        }

        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`ContentManager.loadTexture2DArrayAsync: failed to fetch "${path}": HTTP ${response.status} ${response.statusText}`.trim());
        }
        const bytes = new Uint8Array(await response.arrayBuffer());
        const layers = ContentManager._readKtx2LayerCount(bytes, path);

        const entry = { texture: this._ktx2Factory.createFromBuffer(bytes), layers };
        if (contentConfig?.keepDataCached == true) {
            this._ktx2ArrayCache[path] = entry;
        }
        return entry;
    }

    /**
     * Reads the layer count of a KTX2 file from its header. A `layerCount` of 0 (not an array) is 1 layer.
     * @param bytes The KTX2 file bytes.
     * @param path The file path, used in error messages.
     * @returns The layer count, at least 1.
     * @throws Error when the bytes are not a KTX2 file, or the file is a cube map or a 3D texture.
     * @private
     */
    private static _readKtx2LayerCount(bytes: Uint8Array, path: string): number {
        if (bytes.byteLength < KTX2_FACE_COUNT_OFFSET + 4 || KTX2_IDENTIFIER.some((b, i) => bytes[i] !== b)) {
            throw new Error(`ContentManager.loadTexture2DArrayAsync: "${path}" is not a KTX2 file (missing KTX2 identifier or header).`);
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const pixelDepth = view.getUint32(KTX2_PIXEL_DEPTH_OFFSET, true);
        const faceCount = view.getUint32(KTX2_FACE_COUNT_OFFSET, true);
        if (pixelDepth > 0) {
            throw new Error(`ContentManager.loadTexture2DArrayAsync: "${path}" is a 3D texture (pixelDepth ${pixelDepth}); only 2D textures and 2D texture arrays can be loaded as a texture array.`);
        }
        if (faceCount > 1) {
            throw new Error(`ContentManager.loadTexture2DArrayAsync: "${path}" is a cube map (faceCount ${faceCount}); cube maps cannot be loaded as a 2D texture array.`);
        }
        return Math.max(1, view.getUint32(KTX2_LAYER_COUNT_OFFSET, true));
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
        return this._framework.textureFactory.create(width, height, view, 4, undefined, undefined, TextureFormat.RGBA8_UNORM);
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
