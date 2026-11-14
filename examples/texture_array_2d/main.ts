import {vec2} from "gl-matrix";
import {runWithBackendSwitcher} from "../shared/backendSwitcher.ts";
import {
    Color,
    Framework,
    RenderingBackend,
    RenderableMesh,
    Scene,
    type GameTime,
    TextureFormat,
    type IFramework,
    type ITexture2DArray,
    type InspectTextureArrayMaterial,
    type UnlitTextureArrayMaterial,
} from "../../src";

import layer0Url from "./assets/layer0_red_cross.png?url";
import layer1Url from "./assets/layer1_green_circle.png?url";
import layer2Url from "./assets/layer2_blue_stripes.png?url";
import layer3Url from "./assets/layer3_yellow_border.png?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;

/** The 16×16 PNGs, one per texture array layer. */
const LAYER_URLS: ReadonlyArray<string> = [layer0Url, layer1Url, layer2Url, layer3Url];

runWithBackendSwitcher("#game-canvas", ({canvas, backend, isCurrent}) => {
    const framework: IFramework = new Framework({
        canvas,
        renderingBackend: backend,
    });

    // The scene draws the quads; disposing it disposes the meshes and their materials (not the texture).
    let scene: Scene | undefined;
    let texture: ITexture2DArray | undefined;

    framework.addOnLoadContentListener(async () => {
        try {
            const layers = LAYER_URLS.length;
            const loaded = await framework.content.loadTexture2DArrayAsync([...LAYER_URLS], {
                label: "PngLayers",
                textureFormat: TextureFormat.RGBA8_UNORM,
            });
            if (!isCurrent()) {
                loaded.dispose();
                return;
            }

            texture = loaded;
            scene = new Scene(framework);
            for (let layer = 0; layer < layers; layer++) {
                // Top row: the inspect material.
                const inspectMaterial: InspectTextureArrayMaterial = framework.materialFactory.createInspectTextureArrayMaterial();
                inspectMaterial.texture = texture;
                inspectMaterial.layer = layer;
                const inspectMesh = new RenderableMesh(framework, inspectMaterial);
                inspectMesh.setGeometry(framework.geometryBuilder.quadGeometry(vec2.fromValues(0.42, 0.42)));
                inspectMesh.transform.position[0] = -0.72 + layer * 0.48;
                inspectMesh.transform.position[1] = 0.26;
                scene.add(inspectMesh);

                // Bottom row: the unlit texture array material.
                const unlitMaterial: UnlitTextureArrayMaterial = framework.materialFactory.createUnlitTextureArrayMaterial();
                unlitMaterial.diffuseTexture = texture;
                unlitMaterial.layer = layer;
                const unlitMesh = new RenderableMesh(framework, unlitMaterial);
                unlitMesh.setGeometry(framework.geometryBuilder.quadGeometry(vec2.fromValues(0.42, 0.42)));
                unlitMesh.transform.position[0] = -0.72 + layer * 0.48;
                unlitMesh.transform.position[1] = -0.26;
                scene.add(unlitMesh);
            }

            const backendName = backend === RenderingBackend.WEB_GPU ? "WebGPU" : "WebGL";
            status.textContent = `${backendName} texture array: ${layers} PNG layers (16×16). Top: InspectTextureArrayMaterial, bottom: UnlitTextureArrayMaterial.`;
        } catch (error) {
            if (!isCurrent()) {
                return;
            }
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    });

    framework.addOnUpdateListener((time: GameTime) => {
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
        dispose: () => {
            scene?.dispose();
            texture?.dispose();
        },
    };
});
