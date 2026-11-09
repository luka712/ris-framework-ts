import type { ISampler } from "../../sampler/ISampler.ts";
import type { IUniformBuffer } from "../../buffers/IUniformBuffer.ts";
import type { IRenderPipeline } from "../IRenderPipeline.ts";
import type {ITexture2D} from "../../texture/ITexture2D.ts";

/**
 * The pipeline for inspecting texture mip levels.
 */
export interface IInspectTextureMipsRenderPipeline extends IRenderPipeline {

    /** The texture. By default, a 1x1 white texture. */
    texture: ITexture2D;

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
     * Fragment data, one std140 float `[mipLevel]`: the mip level sampled with `textureLod`.
     * By default, the material writes `[0]`.
     */
    fragmentDataBuffer: IUniformBuffer;
}
