import {vec2} from "gl-matrix";
import {runWithBackendSwitcher} from "../shared/backendSwitcher.ts";
import {
    Color,
    Framework,
    RenderingBackend,
    RenderableMesh,
    Scene,
    type GameTime,
    type IFramework,
    type ITexture2D,
    type InspectTextureMipsMaterial,
    TextureSamplerFilteringPreset,
} from "../../src";

// Kodak test image kodim23 (parrots), 768×512, ETC1S KTX2 with its own mip chain. See ../sprite_batch/README.md for source and license.
import kodim23Url from "./kodim23.ktx2?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const mipSelect = document.querySelector<HTMLSelectElement>("#mip-level")!;

runWithBackendSwitcher("#game-canvas", ({canvas, backend, isCurrent}) => {
    const framework: IFramework = new Framework({
        canvas,
        renderingBackend: backend,
        textureFiltering: TextureSamplerFilteringPreset.TRILINEAR
    });

    // The scene draws the quad; disposing it disposes the meshes and their materials (not the texture).
    let scene: Scene | undefined;
    let texture: ITexture2D | undefined;
    let material: InspectTextureMipsMaterial | undefined;

    const onMipChange = () => {
        if (material) {
            material.mipLevel = Number(mipSelect.value);
        }
    };
    mipSelect.addEventListener("change", onMipChange);

    framework.addOnLoadContentListener(async () => {
        try {
            // The KTX2 file carries every mip level; loadTexture2DAsync uploads all of them.
            const loaded = await framework.content.loadTexture2DAsync(kodim23Url);
            if (!isCurrent()) {
                loaded.dispose();
                return;
            }
            texture = loaded;
            const levelCount = texture.mipLevels;

            // One quad showing the selected level with textureLod / textureSampleLevel, in the image's aspect ratio.
            material = framework.materialFactory.createInspectTextureMipsMaterial();
            material.texture = texture;
            const quadWidth = 1.8;
            const quadHeight = quadWidth * (texture.size[1] / texture.size[0]) * (canvas.width / canvas.height);
            const mesh = new RenderableMesh(framework, material);
            mesh.setGeometry(framework.geometryBuilder.quadGeometry(vec2.fromValues(quadWidth, quadHeight)));
            scene = new Scene(framework);
            scene.add(mesh);

            // Keep the selected level across backend switches when the texture still has it.
            const previous = Number(mipSelect.value) || 0;
            mipSelect.replaceChildren();
            for (let level = 0; level < levelCount; level++) {
                const width = Math.max(1, texture.size[0] >> level);
                const height = Math.max(1, texture.size[1] >> level);
                mipSelect.add(new Option(`${level} (${width}×${height})`, String(level)));
            }
            mipSelect.value = String(Math.min(previous, levelCount - 1));
            mipSelect.disabled = false;
            onMipChange();

            const backendName = backend === RenderingBackend.WEB_GPU ? "WebGPU" : "WebGL";
            status.textContent = `${backendName}: kodim23.ktx2 (${texture.size[0]}×${texture.size[1]}, ${texture.textureFormat}) `
                + `with ${levelCount} mip levels.`;
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
            mipSelect.removeEventListener("change", onMipChange);
            mipSelect.disabled = true;
            scene?.dispose();
            texture?.dispose();
        },
    };
});
