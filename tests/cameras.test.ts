import { describe, expect, it, vi } from "vitest";
import { mat4, vec2, vec3 } from "gl-matrix";
import {
    GameTime,
    MouseButton,
    MouseState,
    OrbitCamera,
    OrthographicCamera,
    PerspectiveCamera,
    TouchCollection,
    TouchLocationState,
    TransformNode,
    type IFramework,
    type IInputManager,
} from "../src/api/index.ts";

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
    const core = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near, far });
    const orbit = new OrbitCamera(core, {
        getMouseState: () => mouse,
        getTouchCollection: () => touches,
    } as IInputManager);
    return { core, orbit };
}

describe("PerspectiveCamera", () => {
    it("defaults to world (0, 0, -3) looking at the origin, with the same view as before the transform", () => {
        const camera = new PerspectiveCamera(framework, { fov: 90, aspectRatio: 2, near: 0.1, far: 100 });

        expectComponents(camera.transform.position, [0, 0, -3]);
        expectComponents(camera.getEye(), [0, 0, -3]);
        expectComponents(camera.direction, [0, 0, 1]);
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

    it("has a std140 eye position buffer that is updated and disposed", () => {
        const buffers: { label?: string; data: number[]; update: ReturnType<typeof vi.fn>; dispose: ReturnType<typeof vi.fn> }[] = [];
        const fw = { bufferFactory: { createUniformBuffer: vi.fn((data: ArrayLike<number>, _usage: unknown, label?: string) => {
            const buffer = { label, data: Array.from(data), update: vi.fn(), dispose: vi.fn() };
            buffers.push(buffer);
            return buffer;
        }) } } as unknown as IFramework;
        const camera = new OrthographicCamera(fw, -1, 1, 1, -1, 0, 10);
        camera.initialize();
        const position = buffers.find(b => b.label === "OrthographicCamera.positionBuffer")!;
        expect(camera.positionBuffer).toBe(position);
        expect(position.data).toEqual([0, 0, 1, 0]);

        vec3.set(camera.transform.position, 1, 2, 3);
        camera.updateBuffers();
        expect(Array.from(position.update.mock.calls[0][0] as number[])).toEqual([1, 2, 3, 0]);

        camera.dispose();
        expect(position.dispose).toHaveBeenCalledOnce();
    });

    it("builds an orthographic projection and a view aimed at the origin", () => {
        const camera = createCamera();

        expect(camera.left).toBe(-1);
        expect(camera.right).toBe(1);
        expect(camera.top).toBe(1);
        expect(camera.bottom).toBe(-1);
        expect(camera.nearPlane).toBe(0);
        expect(camera.farPlane).toBe(1);
        expectComponents(camera.transform.position, [0, 0, 1]);
        expectComponents(camera.projectionMatrix, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -2, 0,
            0, 0, -1, 1,
        ]);
        // Eye at +z looking at the origin: no mirroring of x, so screen-space sprites stay on screen.
        expectComponents(camera.viewMatrix, [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
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
        expect(camera.dirty).toBe(false);

        camera.left = -2;
        expect(camera.dirty).toBe(true);

        camera.recompute();
        camera.clearDirty();
        vec3.set(camera.transform.position, 0, 0, 4);
        camera.recompute();
        expect(camera.viewMatrix[14]).toBeCloseTo(-4, 5);
    });

    it("derives the view from the transform: inverse(T * R), scale ignored", () => {
        const camera = createCamera();
        vec3.set(camera.transform.position, 1, 2, 3);
        vec3.set(camera.transform.rotation, 0.3, -0.7, 0.2);
        vec3.set(camera.transform.scale, 2, 5, 0.5);
        camera.recompute();
        const unscaled = new TransformNode();
        vec3.copy(unscaled.position, camera.transform.position);
        vec3.copy(unscaled.rotation, camera.transform.rotation);
        const expected = mat4.invert(mat4.create(), unscaled.modelMatrix)!;
        expectComponents(camera.viewMatrix, Array.from(expected));
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

        expectComponents(orbit.transform.position, [0, 0, 3]);
        expectComponents(orbit.getTarget(), [0, 0, 0]);
    });

    it("yaws around the target from horizontal mouse movement", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT, dx: 10 }));

        orbit.update(seconds(1));

        expectComponents(orbit.transform.position, [-1.4382766485214233, 0, 2.6327476501464844]);
        expect(vec3.distance(orbit.transform.position, orbit.getTarget())).toBeCloseTo(3, 5);
    });

    it("pitches around the target from vertical mouse movement", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT, dy: 10 }));

        orbit.update(seconds(1));

        expectComponents(orbit.transform.position, [0, 1.4382766485214233, 2.6327476501464844]);
    });

    it("pulls a straight-up eye inside the 89 degree pitch limit", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT }));
        orbit.setEye(vec3.fromValues(0, 3, 0));

        orbit.update(seconds(1));

        expectComponents(orbit.transform.position, [0, 2.9995429515838623, 0.05236632004380226]);
    });

    it("zooms along the view axis with the scroll wheel", () => {
        const away = createOrbit(mouseState({ scrollY: 1 }));
        away.orbit.update(seconds(1));
        expect(away.orbit.transform.position[2]).toBeCloseTo(3.9730873107910156, 5);
        expect(away.orbit.viewMatrix[14]).toBeCloseTo(-away.orbit.transform.position[2], 5);

        const toward = createOrbit(mouseState({ scrollY: -1 }));
        toward.orbit.update(seconds(1));
        expect(toward.orbit.transform.position[2]).toBeCloseTo(2.0269126892089844, 5);
    });

    it("clamps the zoom step to maxScrollSpeed", () => {
        const { orbit } = createOrbit(mouseState({ scrollY: 1 }));
        orbit.scrollSpeed = 100;
        orbit.maxScrollSpeed = 50;

        orbit.update(seconds(1));

        expect(orbit.transform.position[2]).toBeCloseTo(53, 5);
    });

    it("ignores the scroll wheel while the orbit button is down", () => {
        const { orbit } = createOrbit(mouseState({
            button: MouseButton.LEFT,
            scrollY: 1,
        }));

        orbit.update(seconds(1));

        expectComponents(orbit.transform.position, [0, 0, 3]);
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

        expectComponents(orbit.transform.position, [-1.4382766485214233, 0, 2.6327476501464844]);
        expect(vec3.distance(orbit.transform.position, orbit.getTarget())).toBeCloseTo(3, 5);
    });

    it("ignores a cancelled touch the same way it ignores a release", () => {
        const touches = new TouchCollection();
        touches.tryAdd(
            1,
            TouchLocationState.CANCELLED,
            10,
            0,
            0,
            TouchLocationState.MOVED,
            0,
            0,
            0,
        );
        const { orbit } = createOrbit(mouseState({}), 0.01, 100, touches);

        orbit.update(seconds(1));

        expectComponents(orbit.transform.position, [0, 0, 3]);
        expectComponents(orbit.getTarget(), [0, 0, 0]);
    });

    it("rejects a zoom when the length check is outside the far plane", () => {
        const { core, orbit } = createOrbit(mouseState({ scrollY: 1 }));
        orbit.setEye(vec3.fromValues(0, 0, 1));
        core.nearPlane = 0.01;
        // The zoom step would move the eye past the far plane.
        core.farPlane = 1.2;

        orbit.update(seconds(1));

        expect(orbit.transform.position[2]).toBeCloseTo(1, 5);
    });
});

describe("Camera transform", () => {
    it("matches the old look-at defaults numerically", () => {
        // Old PerspectiveCamera: lookAt(eye (0,0,3) with z flipped, origin, +Y).
        const persp = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100 });
        expectComponents(persp.viewMatrix, Array.from(mat4.lookAt(mat4.create(), [0, 0, -3], [0, 0, 0], [0, 1, 0])));
        // Old OrthographicCamera: lookAt((0,0,1), origin, +Y).
        const ortho = new InspectableOrthographicCamera(framework, -1, 1, 1, -1, 0, 1);
        expectComponents(ortho.viewMatrix, Array.from(mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0])));
        // Old OrbitCamera: eye (0,0,-3) z flipped -> world (0,0,3).
        const { orbit } = createOrbit(mouseState({}));
        orbit.update(seconds(0));
        expectComponents(orbit.viewMatrix, Array.from(mat4.lookAt(mat4.create(), [0, 0, 3], [0, 0, 0], [0, 1, 0])));
    });

    it("lookAt rotates the transform so the view equals a look-at from its position", () => {
        const camera = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100, position: [4, 3, -2] });
        const target = vec3.fromValues(-1, 0.5, 2);
        camera.lookAt(target);
        camera.update(seconds(0));
        expectComponents(camera.viewMatrix, Array.from(mat4.lookAt(mat4.create(), [4, 3, -2], target, [0, 1, 0])));
        const dir = vec3.normalize(vec3.create(), vec3.sub(vec3.create(), target, [4, 3, -2]));
        expectComponents(camera.direction, Array.from(dir));
    });

    it("follows the transform (and a parent transform) on update, and feeds the world position", () => {
        const camera = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100 });
        const parent = new TransformNode();
        vec3.set(parent.position, 10, 0, 0);
        parent.addChild(camera.transform);
        camera.update(seconds(0));
        expectComponents(camera.getEye(), [10, 0, -3]);
        expectComponents(camera.viewMatrix, Array.from(mat4.lookAt(mat4.create(), [10, 0, -3], [10, 0, 0], [0, 1, 0])));
    });

    const LA = (eye: number[], target: number[], up: number[]) =>
        Array.from(mat4.lookAt(mat4.create(), eye as vec3, target as vec3, up as vec3));

    it("setEye/setTarget/setUp match mat4.lookAt, and the getters read them back", () => {
        const camera = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100 });
        camera.setTarget([1, 2, 3]);
        camera.setEye([-4, 5, 6]);
        camera.update(seconds(0));
        expectComponents(camera.viewMatrix, LA([-4, 5, 6], [1, 2, 3], [0, 1, 0]));
        expectComponents(camera.getEye(), [-4, 5, 6]);
        expectComponents(camera.getTarget(), [1, 2, 3]);
        expectComponents(camera.getUp(), [0, 1, 0]);
    });

    it("rolls through a custom up", () => {
        const camera = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100, eye: [2, 1, 4], up: [1, 1, 0] });
        camera.update(seconds(0));
        expectComponents(camera.viewMatrix, LA([2, 1, 4], [0, 0, 0], [1, 1, 0]));
        camera.setUp([0, 0, 1]);
        camera.update(seconds(0));
        expectComponents(camera.viewMatrix, LA([2, 1, 4], [0, 0, 0], [0, 0, 1]));
    });

    it("handles an up parallel to the view direction", () => {
        const camera = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100, eye: [0, 5, 0] });
        camera.update(seconds(0));
        expect(Array.from(camera.viewMatrix).every(Number.isFinite)).toBe(true);
        expectComponents(camera.direction, [0, -1, 0]);
    });

    it("without a target, setEye keeps the rotation and getTarget is eye + direction", () => {
        const camera = new InspectableOrthographicCamera(framework, -1, 1, 1, -1, 0, 10);
        camera.setEye([1, 2, 3]);
        expectComponents(camera.transform.rotation, [0, 0, 0]);
        expectComponents(camera.getTarget(), [1, 2, 2]);
        camera.setTarget([1, 2, 10]);
        camera.lookAt([0, 0, 0]);
        camera.setEye([5, 5, 5]);
        camera.recompute();
        expectComponents(camera.getTarget(), Array.from(vec3.add(vec3.create(), [5, 5, 5], camera.direction)));
    });

    it("setEye converts a world position into the parent's space and setTarget aims in world space", () => {
        const camera = new HeadlessPerspectiveCamera(framework, { fov: 60, aspectRatio: 1, near: 0.1, far: 100 });
        const parent = new TransformNode();
        vec3.set(parent.position, 10, 0, 0);
        vec3.set(parent.rotation, 0, 0.7, 0);
        parent.addChild(camera.transform);
        camera.setEye([3, 4, 5]);
        camera.setTarget([0, 1, 0]);
        camera.update(seconds(0));
        expectComponents(camera.getEye(), [3, 4, 5]);
        expectComponents(camera.viewMatrix, LA([3, 4, 5], [0, 1, 0], [0, 1, 0]));
    });

    it("orbit setTarget sets the orbit point and setEye re-derives the orbit", () => {
        const { orbit } = createOrbit(mouseState({ button: MouseButton.LEFT, dx: 10 }));
        orbit.setTarget([1, 0, 0]);
        orbit.setEye([1, 0, 4]);
        orbit.update(seconds(1));
        expect(vec3.distance(orbit.getEye(), [1, 0, 0])).toBeCloseTo(4, 5);
        expectComponents(orbit.getTarget(), [1, 0, 0]);
        expectComponents(orbit.viewMatrix, LA(Array.from(orbit.getEye()), [1, 0, 0], [0, 1, 0]));
    });
});
