import {
    Color,
    Framework,
    FrameworkConfiguration,
    DirectionalLight,
    PointLight,
    Scene,
    type GameTime,
    type IFramework,
    type IRenderableMesh,
    type PerspectiveCamera,
} from "../../src";
import cubeUrl from "./assets/cube.obj?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const config = new FrameworkConfiguration();
config.canvas = canvas;

const framework: IFramework = new Framework(config);

let camera: PerspectiveCamera | undefined;
let scene: Scene | undefined;
let cube: IRenderableMesh | undefined;
let angle = 0;
/** Radians per second, so the speed does not depend on the frame rate. */
const rotationSpeed = 0.6;

framework.addOnLoadContentListener(async () => {
    try {
        // The scene holds the meshes and the lights; lights are plain data classes with auto-assigned ids.
        scene = new Scene(framework);
        // Passing the scene makes the camera the scene's camera; the scene gives it to the materials of its meshes.
        camera = framework.cameraFactory.createPerspectiveCamera({
            aspectRatio: canvas.width / canvas.height,
            eye: [0, 0, -3],
        }, scene);
        scene.activeAmbientLight.color = new Color(0.4, 0.4, 0.4);

        // The camera sits at world z = -3 (the look-at flips eye z), so this light shines from behind it onto the visible faces.
        new DirectionalLight({name: "sun", color: new Color(1, 1, 1), intensity: 0.8, direction: [-0.4, -0.6, 1]}, scene);
        // Two coloured point lights orbiting the cube; positions are updated every frame.
        new PointLight({name: "warm", color: new Color(1.0, 0.5, 0.2), intensity: 1.2, linear: 0.35, quadratic: 0.44}, scene);
        new PointLight({name: "cool", color: new Color(0.2, 0.5, 1.0), intensity: 1.2, linear: 0.35, quadratic: 0.44}, scene);

        // One submesh per usemtl range with Blinn-Phong materials from the .mtl (Kd, Ka falling back to Kd, Ks, Ns),
        // Each material owns its lights buffer; scene.update() hands it the scene's ambient light and light lists.
        // Same as framework.objLoader.loadAsync(cubeUrl, {projectionViewBuffer, cameraPositionBuffer}).
        cube = await framework.content.loadBlinnPhongMeshAsync(cubeUrl, camera);
        scene.add(cube);
        status.textContent = `Loaded cube.obj: ${cube.subMeshes.length} submeshes, Blinn-Phong materials, ambient light.`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
    }
});

let orbitAngle = 0;
const orbitSpeed = 1.2; // radians per second

framework.addOnUpdateListener((time: GameTime) => {
    if (camera == null || cube == null || scene == null) {
        return;
    }

    // Slowly pulse the ambient light so scene.update() has something to upload.
    scene.activeAmbientLight.intensity = 0.75 + 0.5 * Math.sin(time.elapsedTimeSec);

    // Orbit the point lights around the cube (radius 1.6), opposite each other, tilted on y.
    orbitAngle += orbitSpeed * time.deltaTimeSec;
    scene.pointLights.forEach((light, i) => {
        const a = orbitAngle + i * Math.PI;
        light.position = [1.6 * Math.cos(a), 0.6 * Math.sin(a * 2), 1.6 * Math.sin(a)];
    });
    scene.update(time);

    angle += rotationSpeed * time.deltaTimeSec;
    // Euler radians (x, y, z), applied Y then X; the mesh pushes its model matrix into the submesh materials when it renders.
    if (cube) {
        cube.rotation = [angle * 0.7, angle, 0];
    }

    camera.update(time);
});

framework.addOnRenderListener(() => {
    scene?.render();
});

framework.initialize();
framework.renderer.clearColor = Color.cornerFlowerBlue();
