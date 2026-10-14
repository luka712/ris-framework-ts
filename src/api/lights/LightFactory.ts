import type {Color} from "../data/Color.ts";
import type {AmbientLight} from "./AmbientLight.ts";
import type {LightsBuffer, LightsBufferDescriptor} from "./LightsBuffer.ts";

/** The descriptor for ambient light. */
export interface AmbientLightDescriptor {
    /** The optional name for a light. */
    name?: string;

    /** The value of light. */
    value: Color;
}

/** The light factory */
export interface AmbientLightFactory {

    /**
     * Creates the ambient light.
     * @param desc The descriptor for ambient light.
     */
    createAmbientLight(desc?: AmbientLightDescriptor): AmbientLight;

    /**
     * Creates a lights buffer, which owns the uniform buffer with all lights for shaders.
     * @param desc The optional descriptor with the initial lights and directional light count.
     */
    createLightsBuffer(desc?: LightsBufferDescriptor): LightsBuffer;

}
