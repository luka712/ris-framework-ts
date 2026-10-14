import "reflect-metadata";

import {mat4} from "gl-matrix";
import {
    Color,
    Framework,
    FrameworkConfiguration,
    ObjGeometryMapper,
    ObjLoader,
    type LightsBuffer,
    type ForwardBlinnPhongMaterial,
    type GameTime,
    type IFramework,
    type IMesh,
    type ObjMaterialDefinition,
    type PerspectiveCamera,
    type SubMeshDescriptor,
} from "../../src";
// Imported as text so the .mtl is always found, also when Vite inlines small assets.
import cubeObj from "./assets/cube.obj?raw";
import cubeMtl from "./assets/cube.mtl?raw";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const config = new FrameworkConfiguration();
config.canvas = canvas;

const framework: IFramework = new Framework(config);

let camera: PerspectiveCamera | undefined;
let lights: LightsBuffer | undefined;
let cube: IMesh | undefined;
let materials: ForwardBlinnPhongMaterial[] = [];
let angle = 0;
/** Radians per second, so the speed does not depend on the frame rate. */
const rotationSpeed = 0.6;
const modelMatrix = mat4.create();

/** Creates a Blinn-Phong material coloured by the OBJ material's Kd. */
function createMaterial(definition: ObjMaterialDefinition | undefined): ForwardBlinnPhongMaterial {
    const material = framework.materialFactory.createForwardBlinnPhongMaterial({camera});
    const kd = definition?.diffuseColor ?? [1, 1, 1];
    material.ambientColor = new Color(kd[0], kd[1], kd[2]);
    material.diffuseColor = new Color(kd[0] * 0.6, kd[1] * 0.6, kd[2] * 0.6);
    material.lightsBuffer = lights;
    return material;
}

framework.addOnLoadContentListener(() => {
    try {
        camera = framework.cameraFactory.createPerspectiveCamera(60, canvas.width / canvas.height, 0.1, 100);
        camera.eye = [0, 0, 3];
        // The lights buffer owns the uniform buffer; lights are plain data put into it.
        const ambientLight = framework.ambientLightFactory.createAmbientLight({name: "ambient", value: new Color(0.4, 0.4, 0.4)});
        lights = framework.ambientLightFactory.createLightsBuffer({
            ambientLight,
            directionalLights: [{id: 1, name: "sun", value: new Color(0.8, 0.8, 0.8), direction: [-0.5, -0.7, -1]}],
        });

        // loadMesh only creates unlit materials, so build the lit mesh here from the same OBJ data.
        const loader = new ObjLoader();
        const obj = loader.fromText(cubeObj, loader.parseMtl(cubeMtl));
        const geometry = framework.geometryBuilder.create(ObjGeometryMapper.toDescriptor(obj.geometry));

        const subMeshes: SubMeshDescriptor[] = [];
        for (const range of obj.geometry.materialRanges) {
            const definition = obj.materials.find(m => m.name == range.materialName);
            const material = createMaterial(definition);
            materials.push(material);
            subMeshes.push({material, indexStart: range.indexStart, indexCount: range.indexCount});
        }
        cube = framework.meshFactory.createWithSubMeshes(geometry, subMeshes);
        status.textContent = `Loaded cube.obj: ${subMeshes.length} submeshes, Blinn-Phong materials, ambient light.`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
    }
});

framework.addOnUpdateListener((time: GameTime) => {
    if (camera == null || cube == null || lights == null) {
        return;
    }

    // Slowly pulse the ambient light so update() has something to upload.
    const level = 0.3 + 0.2 * Math.sin(time.elapsedTimeSec);
    lights.ambientLight.value = new Color(level, level, level);
    lights.update();

    angle += rotationSpeed * time.deltaTimeSec;
    mat4.identity(modelMatrix);
    mat4.rotateY(modelMatrix, modelMatrix, angle);
    mat4.rotateX(modelMatrix, modelMatrix, angle * 0.7);
    for (const material of materials) {
        mat4.copy(material.modelMatrix, modelMatrix);
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
