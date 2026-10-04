import "reflect-metadata";

import {Framework} from "../../src/core/Framework.ts";
import {FrameworkConfig} from "../../src/core/FrameworkConfig.ts";
import {TextureSamplerFilteringPreset} from "../../src/core/rendering/enums.ts";
import {Color, Rect, type IFramework, type ITexture2D} from "ris-framework-api";
// Vite inlines files under 4KB as data URLs. A data URL does not end in
// ".ktx2", so ContentManager would skip the KTX2 loader. `no-inline` emits a
// file URL. Dev still appends "?no-inline", which fails that suffix check.
import logoUrl from "./ktx_logo_200.ktx2?url&no-inline";

const logoPath = logoUrl.split(/[?#]/, 1)[0];
if (!logoPath.endsWith(".ktx2")) {
    throw new Error(`Expected a .ktx2 URL, got ${logoUrl}`);
}

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const canvas = document.querySelector<HTMLCanvasElement>("#game-canvas")!;

const frameworkConfig = new FrameworkConfig();
frameworkConfig.canvas = canvas;
frameworkConfig.textureFiltering = TextureSamplerFilteringPreset.BILINEAR;
frameworkConfig.useKtx2 = true;

const framework: IFramework = new Framework(frameworkConfig);
const ktx2Factory = framework.ktx2Factory;
if (ktx2Factory == null) {
    throw new Error("FrameworkConfig.useKtx2 did not create a KTX2 factory.");
}

const white = Color.white();
let logo: ITexture2D | undefined;
let logoRect = new Rect(0, 0, 0, 0);

framework.addOnLoadContentListener(async () => {
    try {
        await ktx2Factory.initializeAsync();
        const texture = await framework.content.loadTexture2DAsync(logoPath);
        logo = texture;
        const x = (canvas.width - texture.width) / 2;
        const y = (canvas.height - texture.height) / 2;
        logoRect = new Rect(x, y, texture.width, texture.height);
        status.textContent = `Loaded ktx_logo_200.ktx2 (${texture.width}×${texture.height}).`;
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
    }
});

framework.addOnRenderListener(() => {
    const spriteBatch = framework.spriteBatch;
    spriteBatch.begin();
    if (logo != null) {
        spriteBatch.draw(logo, logoRect, white);
    }
    spriteBatch.end();
});

// initialize() starts ktx2Factory.initializeAsync() and does not wait for it.
// A .ktx2 loadTexture2DAsync fetches through that module, so finish startup
// before the load-content listener runs.
await ktx2Factory.initializeAsync();
framework.initialize();
framework.renderer.clearColor = Color.lightPink();
