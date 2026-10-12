import "reflect-metadata";

import {
    Color,
    Framework,
    FrameworkConfiguration,
    Rect,
    TextureSamplerFilteringPreset,
    type IFramework,
    type ITexture2D,
} from "../../src/index.ts";
// Kodak test image kodim23 (parrots), resized to 512×341. See README.md for source and license.
import parrotsUrl from "./assets/kodim23.png?url";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const config = new FrameworkConfiguration();
config.canvas = canvas;
config.textureFiltering = TextureSamplerFilteringPreset.BILINEAR;

const framework: IFramework = new Framework(config);

let parrots: ITexture2D | undefined;
const drawRect = new Rect(16, 16, 512, 341);
const color = Color.white();

framework.addOnLoadContentListener(async () => {
    try {
        parrots = await framework.content.loadTexture2DAsync(parrotsUrl);
        drawRect.width = parrots.width;
        drawRect.height = parrots.height;
        status.textContent = `Loaded kodim23.png (${parrots.width}×${parrots.height}).`;
    } catch (error) {
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

framework.initialize();
framework.renderer.clearColor = Color.lightPink();
