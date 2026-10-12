import "reflect-metadata";

import {mat4} from "gl-matrix";
import {
    BaseGeometry,
    Color,
    CullMode,
    Framework,
    FrameworkConfiguration,
    ObjLoader,
    PrimitiveStateDescriptor,
    UnlitMaterialDescriptor,
    type GameTime,
    type IFramework,
    type IGeometry,
    type IMesh,
    type PerspectiveCamera,
    type UnlitMaterial,
} from "../../src/index.ts";
import cubeUrl from "./assets/cube.obj?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const config = new FrameworkConfiguration();
config.canvas = canvas;

const framework: IFramework = new Framework(config);

/** One colour per face, so the cube reads as 3D even without lighting. */
const faceColors: [number, number, number, number][] = [
    [0.90, 0.30, 0.25, 1], // red
    [0.25, 0.70, 0.35, 1], // green
    [0.25, 0.45, 0.90, 1], // blue
    [0.95, 0.80, 0.25, 1], // yellow
    [0.70, 0.35, 0.85, 1], // purple
    [0.25, 0.80, 0.85, 1], // cyan
];

/**
 * ObjLoader returns raw OBJ data: positions, texture coordinates and normals as separate lists,
 * and `indices` as `position/texcoord/normal` triplets per face corner.
 * The unlit material wants one interleaved vertex per index (POS3_COLOR4_TEXTURECOORDS2), so expand the
 * triplets into plain vertices and give every face (two triangles, keyed by its normal) a colour.
 */
function toRenderableGeometry(obj: IGeometry): IGeometry {
    const src = obj.indices ?? [];
    const positions: number[] = [];
    const textureCoords: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let corner = 0; corner < src.length / 3; corner++) {
        const p = src[corner * 3];
        const t = src[corner * 3 + 1];
        const n = src[corner * 3 + 2];
        positions.push(obj.positions![p * 3], obj.positions![p * 3 + 1], obj.positions![p * 3 + 2]);
        textureCoords.push(obj.textureCoords?.[t * 2] ?? 0, obj.textureCoords?.[t * 2 + 1] ?? 0);
        normals.push(obj.normals?.[n * 3] ?? 0, obj.normals?.[n * 3 + 1] ?? 0, obj.normals?.[n * 3 + 2] ?? 0);
        colors.push(...faceColors[n % faceColors.length]);
        indices.push(corner);
    }

    return new BaseGeometry(positions, indices, normals, textureCoords, colors);
}

let camera: PerspectiveCamera | undefined;
let material: UnlitMaterial | undefined;
let cube: IMesh | undefined;
let angle = 0;
/** Radians per second, so the speed does not depend on the frame rate. */
const rotationSpeed = 0.6;

framework.addOnLoadContentListener(async () => {
    try {
        camera = framework.cameraFactory.createPerspectiveCamera(60, canvas.width / canvas.height, 0.1, 100);
        camera.eye = [0, 0, 3];

        const primitive = new PrimitiveStateDescriptor();
        primitive.cullFace = CullMode.NONE;
        const descriptor = new UnlitMaterialDescriptor();
        descriptor.projectionViewBuffer = camera.projectionViewBuffer;
        descriptor.primitiveState = framework.graphicsDevice.createPrimitiveState(primitive);
        material = framework.materialFactory.createUnlitMaterial(descriptor);

        const obj = await new ObjLoader().loadAsync(cubeUrl);
        cube = framework.meshFactory.create(toRenderableGeometry(obj), material);
        status.textContent = `Loaded cube.obj (${(obj.indices?.length ?? 0) / 9} triangles), unlit material.`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
    }
});

framework.addOnUpdateListener((time: GameTime) => {
    if (camera == null || material == null) {
        return;
    }

    angle += rotationSpeed * time.deltaTimeSec;
    const model = material.modelMatrix;
    mat4.identity(model);
    mat4.rotateY(model, model, angle);
    mat4.rotateX(model, model, angle * 0.7);

    camera.update(time);
});

framework.addOnRenderListener(() => {
    if (material == null || cube == null) {
        return;
    }

    material.beforeRender();
    material.renderMesh(cube);
});

framework.initialize();
framework.renderer.clearColor = Color.lightPink();
