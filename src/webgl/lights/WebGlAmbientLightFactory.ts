import {
    AmbientLight,
    Color,
    type AmbientLightDescriptor,
    type AmbientLightFactory,
    type IFramework,
    type LightsBuffer,
    type LightsBufferDescriptor,
    type Scene,
} from "../../api/index.ts";
import {WebGlLightsBuffer} from "./WebGlLightsBuffer.ts";

/** The WebGL implementation of the light factory. */
export class WebGlAmbientLightFactory implements AmbientLightFactory {

    /** The colour used when no descriptor is given. */
    public static readonly DEFAULT_COLOR = new Color(0.1, 0.1, 0.1);

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createAmbientLight(desc?: AmbientLightDescriptor, scene?: Scene): AmbientLight {
        return new AmbientLight({...desc, color: desc?.color ?? WebGlAmbientLightFactory.DEFAULT_COLOR}, scene);
    }

    /** @inheritDoc */
    public __createLightsBuffer(desc?: LightsBufferDescriptor): LightsBuffer {
        return new WebGlLightsBuffer(this._framework, desc);
    }
}
