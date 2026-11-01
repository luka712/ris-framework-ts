import {runWithBackendSwitcher} from "../shared/backendSwitcher.ts";
import {
    Color,
    Framework,
    type IFramework,
    type ITexture2D,
    Rect,
    TextureSamplerFilteringPreset,
} from "../../src/index.ts";
// Kodak test image kodim23 (parrots), resized to 512×341. See README.md for source and license.
import parrotsUrl from "./assets/kodim23.ktx2?url";
import {ColorSpace} from "../../src/api/rendering/enums.ts";

const status = document.querySelector<HTMLParagraphElement>("#status")!;

runWithBackendSwitcher("#game-canvas", ({canvas, backend, isCurrent}) => {
    const framework: IFramework = new Framework({
        canvas,
        renderingBackend: backend,
        textureFiltering: TextureSamplerFilteringPreset.BILINEAR,
        textureColorSpace: ColorSpace.SRGB
    });

    let parrots: ITexture2D | undefined;
    const drawRect = new Rect(16, 16, 512, 341);
    const color = Color.white();

    framework.addOnLoadContentListener(async () => {
        try {
            parrots = await framework.content.loadTexture2DAsync(parrotsUrl);
            drawRect.width = parrots.width;
            drawRect.height = parrots.height;
            status.textContent = `Loaded kodim23.ktx2 (${parrots.width}×${parrots.height}).`;
        } catch (error) {
            if (!isCurrent()) {
                return;
            }
            status.textContent = error instanceof Error ? error.message : String(error);
        }
    });

    framework.addOnRenderListener(() => {
        if (parrots == null) {
            return;
        }

        const spriteBatch = framework.spriteBatch;
        spriteBatch.begin();
        spriteBatch.draw(parrots, drawRect, color);
        spriteBatch.end();
    });

    return {
        framework,
        afterInitialize: () => {
            framework.renderer.clearColor = Color.lightPink();
        },
    };
});
