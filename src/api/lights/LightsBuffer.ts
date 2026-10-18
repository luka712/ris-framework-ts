import type {AmbientLight} from "./AmbientLight.ts";
import type {DirectionalLight} from "./DirectionalLight.ts";
import type {PointLight} from "./PointLight.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IDisposable} from "../core/IDisposable.ts";

/** The number of directional lights the lights buffer and the Blinn-Phong shader hold by default. */
export const DEFAULT_DIRECTIONAL_LIGHTS_COUNT = 3;

/** The number of point lights the lights buffer and the Blinn-Phong shader hold by default. */
export const DEFAULT_POINT_LIGHTS_COUNT = 3;

/** The descriptor for a lights buffer. */
export interface LightsBufferDescriptor {

    /** The ambient light. Defaults to a black ambient light. */
    ambientLight?: AmbientLight;

    /** The initial directional lights. More than {@link maxDirectionalLights} throws. */
    directionalLights?: DirectionalLight[];

    /**
     * The number of directional light slots. Must match `DIRECTIONAL_LIGHTS_COUNT` in the shader.
     * Defaults to {@link DEFAULT_DIRECTIONAL_LIGHTS_COUNT}.
     */
    maxDirectionalLights?: number;

    /** The initial point lights. More than {@link maxPointLights} throws. */
    pointLights?: PointLight[];

    /**
     * The number of point light slots. Must match `POINT_LIGHTS_COUNT` in the shader.
     * Defaults to {@link DEFAULT_POINT_LIGHTS_COUNT}.
     */
    maxPointLights?: number;
}

/**
 * Holds the lights of a scene and owns the uniform buffer that shaders read them from.
 * Assign it to lit materials, e.g. `ForwardBlinnPhongMaterial.lightsBuffer`.
 *
 * std140 layout of the `LightsBuffer` block:
 * Every light colour is written premultiplied by its intensity, so the layout has no intensity field.
 * - `vec3 u_ambientLight` at offset 0, padded to 16 bytes.
 * - `DirectionalLight u_directionalLight[N]` from offset 16, 32 bytes each:
 *   `vec3 light` at +0 and `vec3 direction` at +16.
 * - `PointLight u_pointLight[M]` after the directional lights, 48 bytes each:
 *   `vec3 light` at +0, `float constant` at +12, `vec3 position` at +16, `float linear` at +28, `float quadratic` at +32.
 */
export interface LightsBuffer extends IDisposable {

    /** The ambient light written to the buffer. */
    ambientLight: AmbientLight;

    /** The directional lights written to the buffer. Read-only; use {@link add} and {@link remove}. Unused slots are black. */
    readonly directionalLights: readonly DirectionalLight[];

    /** The number of directional light slots in the buffer. */
    readonly maxDirectionalLights: number;

    /** The point lights written to the buffer. Read-only; use {@link add} and {@link remove}. Unused slots are black. */
    readonly pointLights: readonly PointLight[];

    /** The number of point light slots in the buffer. */
    readonly maxPointLights: number;

    /**
     * The uniform buffer holding the lights for shaders.
     * NOTE: Intended to be used internally, never set this value manually.
     */
    readonly buffer: IUniformBuffer;

    /**
     * Adds a directional or point light. Adding a light that is already in the buffer does nothing.
     * @throws Error when all slots for that kind of light are in use.
     */
    add(light: DirectionalLight | PointLight): void;

    /**
     * Removes a directional or point light.
     * @returns True when the light was in the buffer.
     */
    remove(light: DirectionalLight | PointLight): boolean;

    /** Writes the lights to {@link buffer} if anything changed since the last update. Call once per frame before rendering. */
    update(): void;
}
