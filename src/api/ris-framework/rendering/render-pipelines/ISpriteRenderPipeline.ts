import type { IUniformBuffer } from "../buffers/IUniformBuffer.ts";
import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { ISampler } from "../sampler/ISampler.ts";
import type { IRenderPipeline } from "./IRenderPipeline.ts";

/**
 * The pipeline for sprite rendering.
 */
export interface ISpriteRenderPipeline extends IRenderPipeline {

    /**
     * The diffuse texture.
     */
    spriteTexture: ITexture2D;

    /**
     * The sampler.
     */
    textureSampler?: ISampler;

    /**
     * The projection view uniform buffer.
     */
    projectionViewBuffer: IUniformBuffer;
}
