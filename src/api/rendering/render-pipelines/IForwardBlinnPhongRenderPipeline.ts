import type { ITexture2D } from "../texture/ITexture2D.ts";
import type { ISampler } from "../sampler/ISampler.ts";
import type { IRenderPipeline } from "./IRenderPipeline.ts";
import type { IUniformBuffer } from "../buffers/IUniformBuffer.ts";

/**
 * The Blinn-Phong render pipeline with forward lighting.
 */
export interface IForwardBlinnPhongRenderPipeline extends IRenderPipeline {

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
     * - vec3 ambientColor
     * - vec3 diffuseColor
     */
    materialBuffer: IUniformBuffer;

    /**
     * The lights buffer, `LightsBuffer.buffer`, bound to the shader's `LightsBuffer` block.
     * - vec3 ambientLight
     * - DirectionalLight[DIRECTIONAL_LIGHTS_COUNT] { vec3 light; vec3 direction; }
     */
    lightsBuffer: IUniformBuffer;
}
