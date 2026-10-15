import type {AmbientLight, AmbientLightDescriptor} from "./AmbientLight.ts";
import type {Scene} from "../scene/Scene.ts";
import type {LightsBuffer, LightsBufferDescriptor} from "./LightsBuffer.ts";

/** The light factory */
export interface AmbientLightFactory {

    /**
     * Creates the ambient light.
     * @param desc The descriptor for ambient light. The colour defaults to a dim grey; the id is assigned automatically.
     * @param scene The optional scene to register the light with.
     */
    createAmbientLight(desc?: AmbientLightDescriptor, scene?: Scene): AmbientLight;

    /**
     * Creates a lights buffer, which owns the uniform buffer with all lights for shaders.
     * @param desc The optional descriptor with the initial lights and directional light count.
     */
    __createLightsBuffer(desc?: LightsBufferDescriptor): LightsBuffer;

}
