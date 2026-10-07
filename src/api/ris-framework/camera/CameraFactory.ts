import  {vec2} from "gl-matrix";
import {ICameraFactory} from "./ICameraFactory";
import {IFramework} from "../IFramework";
import {IOrthographicCamera} from "./IOrthographicCamera";
import {OrthographicCamera} from "./OrthographicCamera";
import {OrbitCamera} from "./OrbitCamera";
import {PerspectiveCamera} from "./PerspectiveCamera";
import {MathHelper} from "../utilities/MathHelper";

/** The Camera Factory */
export class CameraFactory implements ICameraFactory {

    static DEFAULT_ORIGIN = vec2.fromValues(0,0);

    /**
     * The constructor.
     * @param _framework
     */
    public constructor(private readonly _framework: IFramework) {}

    /** @inheritDoc */
    public createDefaultOrthographicCamera(origin?: vec2): IOrthographicCamera {

        origin = origin ?? CameraFactory.DEFAULT_ORIGIN;

        const framework = this._framework;
        const left = -framework.renderer.backBufferSize[0] * origin[0];
        const top = -framework.renderer.backBufferSize[1] * origin[1];
        const right = left + framework.renderer.backBufferSize[0];
        const bottom = top + framework.renderer.backBufferSize[1];

        return this.createOrthographicCamera(left, right, top, bottom, 0, 1);
    }

    /** @inheritDoc */
    public createOrthographicCamera(left: number, right: number, top: number, bottom: number, near: number, far: number): IOrthographicCamera {
        const camera = new OrthographicCamera(this._framework, left, right, top, bottom, near, far);
        camera.initialize();
        return camera;
    }

    /** @inheritDoc */
    public createOrbitCamera(fov = 60, aspectRatio = 1, near = 0.01, far = 100): OrbitCamera {
        return new OrbitCamera(this.createPerspectiveCamera(fov, aspectRatio, near, far), this._framework.input);

    }

    /** @inheritDoc */
    public createPerspectiveCamera(fov= 60, aspectRatio = 1, near= 0.01, far = 100): PerspectiveCamera {
        fov = MathHelper.toRadians(fov);
        const camera = new PerspectiveCamera(this._framework, fov, aspectRatio, near, far);
        camera.initialize();
        return camera;
    }

}