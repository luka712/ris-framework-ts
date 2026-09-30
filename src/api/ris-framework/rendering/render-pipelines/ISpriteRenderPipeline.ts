import {IIndexBuffer} from "../buffers/IIndexBuffer";
import {IUniformBuffer} from "../buffers/IUniformBuffer";
import {IVertexBuffer} from "../buffers/IVertexBuffer";
import {ITexture2D} from "../texture/ITexture2D";
import {ISampler} from "../sampler/ISampler";
import {IRenderPipeline} from "./IRenderPipeline";

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
