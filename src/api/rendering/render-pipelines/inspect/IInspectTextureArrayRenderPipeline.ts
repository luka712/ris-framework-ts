import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { ISampler } from "../sampler/ISampler.ts";
import type { IUniformBuffer } from "../buffers/IUniformBuffer.ts";
import type { IRenderPipeline } from "./IRenderPipeline.ts";

/**
 * The pipeline for inspecting texture mip levels.
 */
export interface IInspectTextureMipsRenderPipeline extends IRenderPipeline {

    /**
     * The diffuse texture.
     */
    spriteTexture: ITexture2D;

    /**
     * The texture sampler.
     */
    textureSampler?: ISampler;

    /**
     * The projection view uniform buffer.
     * Contains a single matrix representing the projection view matrix.
     */
    projectionViewBuffer: IUniformBuffer;

    /**
     * The world matrix uniform buffer.
     * Contains a single matrix representing the world matrix.
     */
    modelBuffer: IUniformBuffer;

    /**
     * The buffer of texture constants.
     * For now, it is just a single float value representing the mip level.
     */
    textureConstantsBuffer: IUniformBuffer;
}
