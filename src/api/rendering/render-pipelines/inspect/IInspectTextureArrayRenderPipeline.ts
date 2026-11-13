import type {ITexture2DArray} from "../../texture/ITexture2DArray.ts";
import type {ISampler} from "../../sampler/ISampler.ts";
import type {IUniformBuffer} from "../../buffers/IUniformBuffer.ts";
import type {IRenderPipeline} from "../IRenderPipeline.ts";

/** The pipeline for inspecting a 2D texture array. */
export interface IInspectTextureArrayRenderPipeline extends IRenderPipeline {

    /** The texture array. By default, a 1x1, one-layer white texture array. */
    texture: ITexture2DArray;

    /** The texture sampler. By default, the pipeline's default sampler. */
    textureSampler?: ISampler;

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
     * Fragment data, std140 floats `[inspectLod, layer, mipLevel, padding]`.
     * `inspectLod` is 1 to sample with `textureLod` at `mipLevel`, and 0 to sample the layer with `texture()`.
     * By default, the material writes `[0, 0, 0, 0]`.
     */
    fragmentDataBuffer: IUniformBuffer;
}
