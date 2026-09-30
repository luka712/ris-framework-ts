import {ITexture2D} from "../texture/ITexture2D";
import {ISampler} from "../sampler/ISampler";
import {IRenderPipeline} from "./IRenderPipeline";
import {IUniformBuffer} from "../buffers/IUniformBuffer";

/**
 * The unlit render pipeline.
 */
export interface IUnlitRenderPipeline extends IRenderPipeline {

    /**
     * The diffuse texture.
     */
    diffuseTexture: ITexture2D;

    /**
     * The texture sampler.
     */
    diffuseTextureSampler?: ISampler;

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
     * The material buffer that contains the material properties.
     * - vec4 diffuseColor
     */
    materialBuffer: IUniformBuffer;
}
