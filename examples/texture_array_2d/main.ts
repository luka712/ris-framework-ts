import {vec2} from "gl-matrix";
import {runWithBackendSwitcher} from "../shared/backendSwitcher.ts";
import {
    Color,
    Framework,
    RenderingBackend,
    RenderableMesh,
    TextureFormat,
    type IFramework,
    type InspectTextureArrayMaterial,
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

    const meshes: RenderableMesh[] = [];

    framework.addOnLoadContentListener(async () => {
        if (backend === RenderingBackend.WEB_GPU) {
            status.textContent = "2D texture arrays are not implemented for WebGPU yet.";
            return;
        }

        try {
            const layers = LAYER_URLS.length;
            const texture = await framework.content.loadTexture2DArrayAsync([...LAYER_URLS], {
                label: "PngLayers",
                textureFormat: TextureFormat.RGBA8_UNORM,
            });
            if (!isCurrent()) {
                texture.dispose();
                return;
            }

            for (let layer = 0; layer < layers; layer++) {
                const material: InspectTextureArrayMaterial = framework.materialFactory.createInspectTextureArrayMaterial();
                material.texture = texture;
                material.layer = layer;
                const mesh = new RenderableMesh(framework, material);
                mesh.setGeometry(framework.geometryBuilder.quadGeometry(vec2.fromValues(0.42, 0.42)));
                mesh.transform.position[0] = -0.72 + layer * 0.48;
                meshes.push(mesh);
            }

            status.textContent = `WebGL texture array: ${layers} PNG layers (16×16), one quad each.`;
        } catch (error) {
            if (!isCurrent()) {
                return;
            }
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    });

    framework.addOnRenderListener(() => {
        for (const mesh of meshes) {
            mesh.render();
        }
    });

    return {
        framework,
        afterInitialize: () => {
            framework.renderer.clearColor = Color.lightPink();
        },
        dispose: () => {
            for (const mesh of meshes) {
                mesh.dispose();
            }
        },
    };
});
