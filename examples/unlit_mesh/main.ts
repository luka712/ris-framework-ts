import {runWithBackendSwitcher} from "../shared/backendSwitcher.ts";
import {
    Color,
    Framework,
    type GameTime,
    type IFramework, IFrameworkConfiguration,
    type IRenderableMesh,
    type PerspectiveCamera,
    Scene,
} from "../../src";
import cubeUrl from "./assets/cube.obj?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;

runWithBackendSwitcher("#game-canvas", ({canvas, backend, isCurrent}) => {
    const config: IFrameworkConfiguration = {};
    config.canvas = canvas;
    config.renderingBackend = backend;

    const framework: IFramework = new Framework(config);

    let camera: PerspectiveCamera | undefined;
    let scene: Scene | undefined;
    let cube: IRenderableMesh | undefined;
    let angle = 0;
    /** Radians per second, so the speed does not depend on the frame rate. */
    const rotationSpeed = 0.6;

    framework.addOnLoadContentListener(async () => {
        try {
            // One submesh per usemtl range (6 faces -> 6 submeshes), each with an unlit material coloured by its Kd.
            // scene.add(mesh) wraps it in a SceneMesh (which owns its materials), and scene.render() draws it.
            scene = new Scene(framework);
            // Passing the scene makes the camera the scene's camera.
            camera = framework.cameraFactory.createPerspectiveCamera({
                fov: 60, aspectRatio: canvas.width / canvas.height, near: 0.1, far: 100, position: [0, 0, -3],
            }, scene);
            cube = await framework.content.loadUnlitMeshAsync(cubeUrl);
            scene.add(cube);
            status.textContent = `Loaded cube.obj: ${cube.subMeshes.length} submeshes, unlit materials.`;
        } catch (error) {
            if (!isCurrent()) {
                return;
            }
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    });

    framework.addOnUpdateListener((time: GameTime) => {
        if (camera == null || cube == null) {
            return;
        }

        angle += rotationSpeed * time.deltaTimeSec;
        // The mesh pushes its model matrix into each submesh material when it renders.
        cube.transform.rotation = [angle * 0.7, angle, 0];

        camera.update(time);
        // Assigns the scene camera to the mesh materials (only when it changed).
        scene?.update(time);
    });

    framework.addOnRenderListener(() => {
        scene?.render();
    });

    return {
        framework,
        afterInitialize: () => {
            framework.renderer.clearColor = Color.lightPink();
        },
        dispose: () => scene?.dispose(),
    };
});
