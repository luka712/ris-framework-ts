import type {AmbientLight} from "./AmbientLight.ts";
import type {DirectionalLight} from "./DirectionalLight.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IDisposable} from "../core/IDisposable.ts";

/** The number of directional lights the lights buffer and the Blinn-Phong shader hold by default. */
export const DEFAULT_DIRECTIONAL_LIGHTS_COUNT = 3;

/** The descriptor for a lights buffer. */
export interface LightsBufferDescriptor {

    /** The ambient light. Defaults to a black ambient light. */
    ambientLight?: AmbientLight;

    /** The directional lights. At most {@link maxDirectionalLights} are written. */
    directionalLights?: DirectionalLight[];

    /**
     * The number of directional light slots. Must match `DIRECTIONAL_LIGHTS_COUNT` in the shader.
     * Defaults to {@link DEFAULT_DIRECTIONAL_LIGHTS_COUNT}.
     */
    maxDirectionalLights?: number;
}

/**
 * Holds the lights of a scene and owns the uniform buffer that shaders read them from.
 * Assign it to lit materials, e.g. `ForwardBlinnPhongMaterial.lightsBuffer`.
 *
 * std140 layout of the `LightsBuffer` block:
 * - `vec3 u_ambientLight` at offset 0, padded to 16 bytes.
 * - `DirectionalLight u_directionalLight[N]` from offset 16, 32 bytes each:
 *   `vec3 light` at +0 and `vec3 direction` at +16.
 */
export interface LightsBuffer extends IDisposable {

    /**
     * The ambient to write to buffer.
     */
    ambientLight: AmbientLight;

    /** The directional lights to write to buffer. Unused slots are written as black. */
    directionalLights: DirectionalLight[];

    /** The number of directional light slots in the buffer. */
    readonly maxDirectionalLights: number;

    /**
     * The uniform buffer holding the lights for shaders.
     * NOTE: Intended to be used internally, never set this value manually.
     */
    readonly buffer: IUniformBuffer;

    /** Writes the lights to {@link buffer} if anything changed since the last update. Call once per frame before rendering. */
    update(): void;
}
