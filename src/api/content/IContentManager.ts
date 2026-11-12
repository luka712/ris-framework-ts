import type { ICamera } from "../camera/ICamera.ts";
import type { GeometryFormat } from "../geometry/GeometryFormat.ts";
import type { IRenderableMesh } from "../meshes/IRenderableMesh.ts";
import type { IShaderModuleLoader } from "../shader/IShaderModuleLoader.ts";
import type { IShaderModule } from "../shader/IShaderModule.ts";
import type { ITexture2D } from "../rendering/texture/ITexture2D.ts";
import type {ITextureDescriptor} from "../rendering/texture/ITextureDescriptor.ts";
import {ContentConfig} from "./ContentConfig.ts";
import type { IKtx2Texture } from "ris-ktx2";
import type {IMesh} from "../meshes/IMesh.ts";
import type {ITexture2DArray} from "../rendering/texture/ITexture2DArray.ts";

/**
 * The content manager.
 */
export interface IContentManager {

    /**
     * The shader module loader.
     */
    readonly shaderModuleLoader: IShaderModuleLoader;

    /**
     * Loads a KTX2 container. Initializes the KTX2 transcoder on first use.
     * @param path - The path to the ktx2 asset.
     * @param config - The content configuration. With `keepDataCached`, the container is cached by path and returned on later loads.
     * By default, not cached.
     * @returns The ktx2 texture.
     */
    loadKtx2Async(path: string, config?: ContentConfig): Promise<IKtx2Texture>;

    /**
     * Loads a shader module.
     * @param shaderAssetId - The id of a shader asset.
     * @param keyValueDictionary - If present, replaces each `##KEY##` placeholder in the shader with the value for `KEY`,
     * e.g. `##DIRECTIONAL_LIGHT_COUNT##` with the value for `DIRECTIONAL_LIGHT_COUNT`. By default, none.
     * @returns The shader module.
     */
    loadShaderModule(shaderAssetId: string, keyValueDictionary?: { [id:string]: number}): IShaderModule;

    /**
     * Loads a texture2D from an image file or a `.ktx2` file.
     * @param path - The file path to the texture. Also the label when `desc.label` is not set.
     * @param desc - The texture descriptor. Only `textureFormat`, `preferredColorSpace`, `label`, `textureUsage` and `generateMipmaps` are used.
     * By default, the format is the renderer's {@link IRenderer.preferredTextureFormat} (images) or follows the file (KTX2),
     * and usage is `TEXTURE_BINDING | COPY_SRC` for images.
     * @param contentConfig - The content config. By default, data is not kept cached.
     * @returns The Texture2D.
     */
    loadTexture2DAsync(path: string, desc?: ITextureDescriptor, contentConfig?: ContentConfig): Promise<ITexture2D>;

    /**
     * Loads a texture2D array. Works on WebGL2 and WebGPU.
     * @param filePaths - The image file paths, one per layer, in layer order. All images must have the same size.
     * A single image path is loaded as a one-layer array. A single `.ktx2` path is loaded with
     * {@link ITextureFactory.createTexture2DArrayFromKtx2}: one array layer per KTX2 layer (a non-array file gives one layer),
     * each with all of the file's mip levels, and the format and color space picked like {@link ITextureFactory.createFromKtx2}.
     * Compressed KTX2 formats are not implemented for WebGL2 texture arrays yet (throws); WebGPU supports them. KTX2 cube maps and 3D textures are rejected.
     * @param desc - The texture descriptor. Only `textureFormat`, `preferredColorSpace`, `label`, `textureUsage` and `generateMipmaps` are used.
     * By default, the format is the renderer's {@link IRenderer.preferredTextureFormat}, the label is the first path
     * and usage is `TEXTURE_BINDING | COPY_DST | RENDER_ATTACHMENT` (WebGPU copies the images with `copyExternalImageToTexture`, which needs both).
     * @param contentConfig - The content config. By default, data is not kept cached.
     * @returns The Texture2DArray.
     * @throws Error when `filePaths` is empty or the layers have different sizes, or a `.ktx2` path cannot be fetched or is not a 2D (array) KTX2 file.
     */
    loadTexture2DArrayAsync(filePaths: string[] | string, desc?: ITextureDescriptor, contentConfig?: ContentConfig): Promise<ITexture2DArray>;

    /**
     * Loads a plain mesh (geometry and buffers only, no material or transform) from an OBJ (Wavefront) file,
     * like C# `ContentManager.LoadMesh`. Materials (.mtl) are not loaded.
     * @param path The path or url to the .obj file.
     * @param geometryFormat The vertex layout of the buffers, e.g. the format of the material it will be drawn with.
     * @return The mesh.
     */
    loadMeshAsync(path: string, geometryFormat: GeometryFormat): Promise<IMesh>;

    /**
     * Loads an OBJ mesh with unlit materials, through `framework.objLoader`.
     * The root mesh has no material; each `usemtl` range is a sub mesh with an unlit material
     * (`Kd` as diffuse colour, `d` as alpha, white when missing). Add it with `scene.add(mesh)`.
     * @param path The path or url to the .obj file.
     * @param camera The optional camera; `scene.update()` assigns the scene camera anyway.
     * @return The root mesh.
     */
    loadUnlitMeshAsync(path: string, camera?: ICamera): Promise<IRenderableMesh>;

    /**
     * Loads an OBJ mesh with Blinn-Phong materials: shorthand for
     * `framework.objLoader.loadAsync(path, {projectionViewBuffer: camera.projectionViewBuffer, cameraPositionBuffer: camera.positionBuffer})`.
     * See `ObjLoader.loadAsync` for the .mtl mapping. Add it with `scene.add(mesh)`; the scene assigns its camera and lights.
     * @param path The path or url to the .obj file. A relative `mtllib` is resolved against it.
     * @param camera An initialized camera (e.g. `scene.camera`).
     * @return The root mesh.
     * @throws Error when the camera has no buffers.
     */
    loadBlinnPhongMeshAsync(path: string, camera: ICamera): Promise<IRenderableMesh>;

}
