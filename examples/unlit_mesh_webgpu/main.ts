import {
    Color,
    Framework,
    RenderingBackend,
    type GameTime,
    type IFramework,
    type IRenderableMesh,
    type PerspectiveCamera,
    Scene, IFrameworkConfiguration,
} from "../../src";
import cubeUrl from "../unlit_mesh/assets/cube.obj?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const config : IFrameworkConfiguration={};
config.canvas = canvas;
// Ask for WebGPU. Without navigator.gpu (or a device), the framework falls back to WebGL with a warning.
config.renderingBackend = RenderingBackend.WEB_GPU;

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
            fov: 60, aspectRatio: canvas.width / canvas.height, near: 0.1, far: 100, eye: [0, 0, 3],
        }, scene);
        cube = await framework.content.loadUnlitMeshAsync(cubeUrl, camera);
        scene.add(cube);
        status.textContent = `Loaded cube.obj: ${cube.subMeshes.length} submeshes, unlit materials. Backend: ${RenderingBackend[framework.renderingBackend]}.`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
    }
});

framework.addOnUpdateListener((time: GameTime) => {
    if (camera == null || cube == null) {
        return;
    }

    angle += rotationSpeed * time.deltaTimeSec;
    // The mesh pushes its model matrix into each submesh material when it renders.
    cube.rotation = [angle * 0.7, angle, 0];

    camera.update(time);
    // Assigns the scene camera to the mesh materials (only when it changed).
    scene?.update(time);
});

framework.addOnRenderListener(() => {
    scene?.render();
});

// WebGPU requests its device asynchronously, so use initializeAsync().
framework.initializeAsync().then(() => {
    framework.renderer.clearColor = Color.lightPink();
}).catch(error => {
    status.textContent = error instanceof Error ? error.message : String(error);
});
