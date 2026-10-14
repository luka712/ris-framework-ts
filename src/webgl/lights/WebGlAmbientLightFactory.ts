import {
    AmbientLight,
    Color,
    type AmbientLightDescriptor,
    type AmbientLightFactory,
    type IFramework,
    type LightsBuffer,
    type LightsBufferDescriptor,
} from "../../api/index.ts";
import {WebGlLightsBuffer} from "./WebGlLightsBuffer.ts";

/** The WebGL implementation of the light factory. */
export class WebGlAmbientLightFactory implements AmbientLightFactory {

    /** The colour used when no descriptor is given. */
    public static readonly DEFAULT_VALUE = new Color(0.1, 0.1, 0.1);

    private _nextId = 1;

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createAmbientLight(desc?: AmbientLightDescriptor): AmbientLight {
        const value = desc?.value ?? WebGlAmbientLightFactory.DEFAULT_VALUE;
        const id = this._nextId;
        this._nextId++;
        return new AmbientLight(id, value.copy(), desc?.name);
    }

    /** @inheritDoc */
    public createLightsBuffer(desc?: LightsBufferDescriptor): LightsBuffer {
        return new WebGlLightsBuffer(this._framework, desc);
    }
}
