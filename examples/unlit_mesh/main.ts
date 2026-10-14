import "reflect-metadata";

import {mat4} from "gl-matrix";
import {
    Color,
    Framework,
    FrameworkConfiguration,
    type GameTime,
    type IFramework,
    type IMesh,
    type PerspectiveCamera,
} from "../../src";
import cubeUrl from "./assets/cube.obj?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const config = new FrameworkConfiguration();
config.canvas = canvas;

const framework: IFramework = new Framework(config);

let camera: PerspectiveCamera | undefined;
let cube: IMesh | undefined;
let angle = 0;
/** Radians per second, so the speed does not depend on the frame rate. */
const rotationSpeed = 0.6;
const modelMatrix = mat4.create();

framework.addOnLoadContentListener(async () => {
    try {
        camera = framework.cameraFactory.createPerspectiveCamera(60, canvas.width / canvas.height, 0.1, 100);
        camera.eye = [0, 0, 3];
        // Vite may inline small assets as data: URLs, so point mtllib at the bundled .mtl explicitly.
        // One submesh per usemtl range (6 faces -> 6 submeshes), each with an unlit material coloured by its Kd.
        cube = await framework.content.loadMesh(cubeUrl, camera);
        status.textContent = `Loaded cube.obj: ${cube.subMeshes?.length ?? 0} submeshes, unlit materials.`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
    }
});

framework.addOnUpdateListener((time: GameTime) => {
    if (camera == null || cube == null) {
        return;
    }

    angle += rotationSpeed * time.deltaTimeSec;
    mat4.identity(modelMatrix);
    mat4.rotateY(modelMatrix, modelMatrix, angle);
    mat4.rotateX(modelMatrix, modelMatrix, angle * 0.7);
    // Each submesh has its own material, and the model matrix lives on the material.
    for (const subMesh of cube.subMeshes ?? []) {
        mat4.copy(subMesh.material!.modelMatrix, modelMatrix);
    }

    camera.update(time);
});

framework.addOnRenderListener(() => {
    if (cube == null) {
        return;
    }

    for (const subMesh of cube.subMeshes ?? []) {
        subMesh.material!.beforeRender();
        subMesh.material!.renderMesh(subMesh);
    }
});

framework.initialize();
framework.renderer.clearColor = Color.lightPink();
