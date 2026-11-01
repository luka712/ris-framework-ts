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
     * - vec3 specularColor
     * - float shininess
     */
    materialBuffer: IUniformBuffer;

    /** The camera position buffer: std140 `vec3` world-space eye, e.g. `camera.positionBuffer`. */
    cameraPositionBuffer: IUniformBuffer;

    /**
     * The lights buffer, `LightsBuffer.buffer`, bound to the shader's `LightsBuffer` block.
     * - vec3 ambientLight
     * - DirectionalLight[DIRECTIONAL_LIGHTS_COUNT] { vec3 light; vec3 direction; }
     * - PointLight[POINT_LIGHTS_COUNT] { vec3 light; float constant; vec3 position; float linear; float quadratic; }
     */
    lightsBuffer: IUniformBuffer;

    /** The directional light slots the shader was compiled with. */
    readonly maxDirectionalLights: number;

    /** The point light slots the shader was compiled with. */
    readonly maxPointLights: number;

    /**
     * Sets the light slot counts. They must match the lights buffer (`LightsBuffer.maxDirectionalLights`/`maxPointLights`).
     * When they change after initialization the shader variant for the new counts is loaded.
     * @param maxDirectionalLights The directional light slots.
     * @param maxPointLights The point light slots.
     */
    setLightCounts(maxDirectionalLights: number, maxPointLights: number): void;
}
