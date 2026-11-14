import type {ITexture2DArray} from "../texture/ITexture2DArray.ts";
import type {ISampler} from "../sampler/ISampler.ts";
import type {IRenderPipeline} from "./IRenderPipeline.ts";
import type {IUniformBuffer} from "../buffers/IUniformBuffer.ts";

/**
 * The unlit render pipeline for a 2D texture array: samples one layer of a `sampler2DArray` / `texture_2d_array`.
 */
export interface IUnlitTextureArrayRenderPipeline extends IRenderPipeline {

    /** The diffuse texture array. By default, the texture factory's 1x1, one-layer white texture array. */
    diffuseTexture: ITexture2DArray;

    /** The texture sampler. By default, the pipeline's default sampler. */
    diffuseTextureSampler?: ISampler;

    /**
     * The projection view uniform buffer.
     * Contains one std140 `mat4`.
     */
    projectionViewBuffer: IUniformBuffer;

    /**
     * The model uniform buffer.
     * Contains one std140 `mat4`.
     */
    modelBuffer: IUniformBuffer;

    /**
     * The material buffer, std140 floats `[r, g, b, a, layer, padding, padding, padding]`:
     * `vec4 diffuseColor` followed by `float layer`, the array layer to sample.
     */
    materialBuffer: IUniformBuffer;
}
