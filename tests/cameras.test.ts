import { describe, expect, it } from "vitest";
import { vec2, vec3 } from "gl-matrix";
import {
    GameTime,
    MouseButton,
    MouseState,
    OrbitCamera,
    OrthographicCamera,
    PerspectiveCamera,
    TouchCollection,
    TouchLocationState,
    type IFramework,
    type IInputManager,
} from "../src/index.ts";

const framework = {} as IFramework;

function expectComponents(actual: ArrayLike<number>, expected: readonly number[]): void {
    expect(actual.length).toBe(expected.length);
    expected.forEach((value, index) => {
        expect(actual[index]).toBeCloseTo(value, 5);
    });
}

class InspectableOrthographicCamera extends OrthographicCamera {
    public recompute(): void {
        this._updateMatrices();
    }

    public get dirty(): boolean {
        return this._isDirty;
    }

    public clearDirty(): void {
        this._isDirty = false;
    }
}

class HeadlessPerspectiveCamera extends PerspectiveCamera {
    public override update(_time: GameTime): void {
        this._updateMatrices();
    }

    public override updateBuffers(): void {
    }

    public override dispose(): void {
    }
}

function mouseState(options: {
    button?: MouseButton;
    dx?: number;
    dy?: number;
    scrollY?: number;
}): MouseState {
    const down: { [key: number]: boolean } = {};
    if (options.button !== undefined) {
        down[options.button] = true;
    }

    return new MouseState(
        down,
        {},
        vec2.fromValues(0, 0),
        vec2.fromValues(options.dx ?? 0, options.dy ?? 0),
        vec2.fromValues(0, options.scrollY ?? 0),
    );
}

function seconds(value: number): GameTime {
    const time = new GameTime();
    time.deltaTimeMs = value * 1000;
    time.elapsedTimeMs = value * 1000;
    return time;
}

function createOrbit(
    mouse: MouseState,
    near = 0.01,
    far = 100,
    touches = new TouchCollection(),
): {
    core: HeadlessPerspectiveCamera;
    orbit: OrbitCamera;
} {
    const core = new HeadlessPerspectiveCamera(framework, Math.PI / 3, 1, near, far);
    const orbit = new OrbitCamera(core, {
        getMouseState: () => mouse,
        getTouchCollection: () => touches,
    } as IInputManager);
    return { core, orbit };
}

describe("PerspectiveCamera", () => {
    it("builds a right-handed view by flipping the eye z before look-at", () => {
        const camera = new PerspectiveCamera(framework, Math.PI / 2, 2, 0.1, 100);

        expectComponents(camera.eye, [0, 0, 3]);
        expectComponents(camera.target, [0, 0, 0]);
        expectComponents(camera.up, [0, 1, 0]);
        expectComponents(camera.direction, [0, 0, -3]);
        expect(camera.fieldOfView).toBeCloseTo(Math.PI / 2, 12);
        expect(camera.aspectRatio).toBe(2);
        expect(camera.nearPlane).toBe(0.1);
        expect(camera.farPlane).toBe(100);

        expectComponents(camera.projectionMatrix, [
            0.5, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1.0020020008087158, -1,
            0, 0, -0.20020020008087158, 0,
        ]);
        expectComponents(camera.viewMatrix, [
            -1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1, 0,
            0, 0, -3, 1,
        ]);
        expectComponents(camera.projectionViewMatrix, [
            -0.5, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1.0020020008087158, 1,
            0, 0, 2.8058056831359863, 3,
        ]);
    });
});

describe("OrthographicCamera", () => {
    function createCamera(): InspectableOrthographicCamera {
        return new InspectableOrthographicCamera(framework, -1, 1, 1, -1, 0, 1);
    }

    it("builds an orthographic projection and a view aimed at the origin", () => {
        const camera = createCamera();

        expect(camera.left).toBe(-1);
        expect(camera.right).toBe(1);
        expect(camera.top).toBe(1);
        expect(camera.bottom).toBe(-1);
        expect(camera.nearPlane).toBe(0);
        expect(camera.farPlane).toBe(1);
        expectComponents(camera.eye, [0, 0, -1]);
        expectComponents(camera.projectionMatrix, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -2, 0,
            0, 0, -1, 1,
        ]);
        expectComponents(camera.viewMatrix, [
            -1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1, 0,
            0, 0, -1, 1,
        ]);
    });

    it("keeps the previous projection until the matrices are recomputed", () => {
        const camera = createCamera();
        const previous = Array.from(camera.projectionMatrix);

        camera.left = -2;

        expect(Array.from(camera.projectionMatrix)).toEqual(previous);

        camera.recompute();

        expectComponents(camera.projectionMatrix, [
            2 / 3, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -2, 0,
            1 / 3, 0, -1, 1,
        ]);
    });

    it("marks the camera dirty only when a volume property changes", () => {
        const camera = createCamera();
        camera.clearDirty();

        camera.left = camera.left;
        camera.right = camera.right;
        camera.top = camera.top;
        camera.bottom = camera.bottom;
        camera.nearPlane = camera.nearPlane;
        camera.farPlane = camera.farPlane;
        camera.eye = camera.eye;
        expect(camera.dirty).toBe(false);

        camera.left = -2;
        expect(camera.dirty).toBe(true);

        camera.clearDirty();
        camera.eye = vec3.fromValues(0, 0, -4);
        expect(camera.dirty).toBe(true);
        camera.recompute();
        expect(camera.viewMatrix[14]).toBeCloseTo(-4, 5);
    });

    it("aims the view at the internal origin rather than the public target field", () => {
        const camera = createCamera();
        camera.target[2] = 5;
        camera.recompute();

        expect(camera.viewMatrix[14]).toBeCloseTo(-1, 5);
    });
});

describe("OrbitCamera", () => {
    it("throws from the unimplemented buffer entry points", () => {
        const { orbit } = createOrbit(mouseState({}));

        expect(() => orbit.initialize()).toThrow("Not implemented");
        expect(() => orbit.updateBuffers()).toThrow("Not implemented");
    });

    it("keeps a zero mouse delta from moving the eye", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT }));

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [0, 0, -3]);
        expectComponents(orbit.target, [0, 0, 0]);
    });

    it("yaws around the target from horizontal mouse movement", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT, dx: 10 }));

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [-1.4382766485214233, 0, -2.6327476501464844]);
        expect(vec3.distance(orbit.eye, orbit.target)).toBeCloseTo(3, 5);
    });

    it("pitches around the target from vertical mouse movement", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT, dy: 10 }));

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [0, 1.4382766485214233, -2.6327476501464844]);
    });

    it("clamps pitch to 179 degrees", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT, dy: 1000 }));

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [0, 0.05235830321907997, 2.9995429515838623]);
    });

    it("pulls a straight-up eye inside the 89 degree pitch limit", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT }));
        orbit.eye = vec3.fromValues(0, 3, 0);
        orbit.target = vec3.fromValues(0, 0, 0);

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [0, 2.9995429515838623, -0.05236632004380226]);
    });

    it("zooms along the view axis with the scroll wheel", () => {
        const away = createOrbit(mouseState({ scrollY: 1 }));
        away.orbit.update(seconds(1));
        expect(away.orbit.eye[2]).toBeCloseTo(-3.9730873107910156, 5);
        expect(away.orbit.viewMatrix[14]).toBeCloseTo(away.orbit.eye[2], 5);

        const toward = createOrbit(mouseState({ scrollY: -1 }));
        toward.orbit.update(seconds(1));
        expect(toward.orbit.eye[2]).toBeCloseTo(-2.0269126892089844, 5);
    });

    it("clamps the zoom step to maxScrollSpeed", () => {
        const { orbit } = createOrbit(mouseState({ scrollY: 1 }));
        orbit.scrollSpeed = 100;
        orbit.maxScrollSpeed = 50;

        orbit.update(seconds(1));

        expect(orbit.eye[2]).toBeCloseTo(-53, 5);
    });

    it("ignores the scroll wheel while the orbit button is down", () => {
        const { orbit } = createOrbit(mouseState({
            button: MouseButton.LEFT,
            scrollY: 1,
        }));

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [0, 0, -3]);
    });

    it("yaws from one held touch and ignores a released contact", () => {
        const touches = new TouchCollection();
        touches.tryAdd(
            1,
            TouchLocationState.MOVED,
            10,
            0,
            0,
            TouchLocationState.PRESSED,
            0,
            0,
            0,
        );
        touches.tryAdd(2, TouchLocationState.RELEASED, 0, 40);
        const { orbit } = createOrbit(mouseState({}), 0.01, 100, touches);

        orbit.update(seconds(1));

        expectComponents(orbit.eye, [-1.4382766485214233, 0, -2.6327476501464844]);
        expect(vec3.distance(orbit.eye, orbit.target)).toBeCloseTo(3, 5);
    });

    it("pinch-zooms from two held touches and skips a repeated distance", () => {
        const touches = new TouchCollection();
        touches.tryAdd(1, TouchLocationState.MOVED, 0, 0);
        touches.tryAdd(2, TouchLocationState.MOVED, 100, 0);
        const { orbit } = createOrbit(mouseState({}), 0.01, 100, touches);

        orbit.update(seconds(1));
        expect(orbit.eye[2]).toBeCloseTo(-2.0269126892089844, 5);

        orbit.update(seconds(1));
        expect(orbit.eye[2]).toBeCloseTo(-2.0269126892089844, 5);
    });

    it("rejects a zoom when the length check is outside the far plane", () => {
        const { core, orbit } = createOrbit(mouseState({ scrollY: 1 }));
        orbit.eye = vec3.fromValues(0, 0, -1);
        core.nearPlane = 0.01;
        core.farPlane = 2;

        orbit.update(seconds(1));

        expect(orbit.eye[2]).toBeCloseTo(-1, 5);
    });
});
