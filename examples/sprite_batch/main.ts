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
import parrotsUrl from "./assets/kodim23_etc1s.ktx2?url";
import {OutputColorSpace} from "../../src/api/rendering/enums.ts";

const status = document.querySelector<HTMLParagraphElement>("#status")!;
const outputButton = document.querySelector<HTMLButtonElement>("#output-color-space")!;
const outputLabel = document.querySelector<HTMLSpanElement>("#output-color-space-label")!;

// The output color space is switched at runtime through renderer.outputColorSpace and kept across backend switches (?output=srgb). NONE is the default.
const OUTPUT_KEY = "output";
let outputColorSpace = new URLSearchParams(location.search).get(OUTPUT_KEY) === "srgb" ? OutputColorSpace.SRGB : OutputColorSpace.NONE;
let currentFramework: IFramework | undefined;

// The swap chain is not part of the public API; WebGPU's graphics device exposes it, WebGL always presents to an RGBA8 framebuffer.
const swapChainFormat = (framework: IFramework): string =>
    (framework.graphicsDevice as unknown as {swapChain?: {textureFormat: string} | null}).swapChain?.textureFormat ?? "RGBA8_UNORM (WebGL default framebuffer)";

const logOutput = (framework: IFramework) => {
    console.log(`[sprite_batch] output color space: ${framework.renderer.outputColorSpace}, `
        + `main render target: ${framework.renderer.preferredTextureFormat}, swap chain: ${swapChainFormat(framework)}`);
};

const updateOutputUi = () => {
    const other = outputColorSpace === OutputColorSpace.SRGB ? OutputColorSpace.NONE : OutputColorSpace.SRGB;
    outputButton.textContent = `Switch output to ${other}`;
    outputLabel.textContent = `Output color space: ${outputColorSpace}`;
};

outputButton.addEventListener("click", () => {
    outputColorSpace = outputColorSpace === OutputColorSpace.SRGB ? OutputColorSpace.NONE : OutputColorSpace.SRGB;
    const url = new URL(location.href);
    if (outputColorSpace === OutputColorSpace.SRGB) {
        url.searchParams.set(OUTPUT_KEY, "srgb");
    } else {
        url.searchParams.delete(OUTPUT_KEY);
    }
    history.replaceState(null, "", url);
    if (currentFramework) {
        currentFramework.renderer.outputColorSpace = outputColorSpace;
        logOutput(currentFramework);
    }
    updateOutputUi();
});
updateOutputUi();

runWithBackendSwitcher("#game-canvas", ({canvas, backend, isCurrent}) => {
    const framework: IFramework = new Framework({
        canvas,
        renderingBackend: backend,
        textureFiltering: TextureSamplerFilteringPreset.BILINEAR,
        outputColorSpace,
    });
    currentFramework = framework;

    let parrots: ITexture2D | undefined;
    const drawRect = new Rect(16, 16, 512, 341);
    const color = Color.white();

    framework.addOnLoadContentListener(async () => {
        try {
            parrots = await framework.content.loadTexture2DAsync(parrotsUrl);
            drawRect.width = parrots.size[0];
            drawRect.height = parrots.size[1];
            // TextureFormat is a string enum, so the value is the enum name.
            console.log(`[sprite_batch] kodim23_etc1s.ktx2: format ${parrots.textureFormat}, `
                + `size ${parrots.size[0]}×${parrots.size[1]}, native size ${parrots.nativeSize[0]}×${parrots.nativeSize[1]}`);
            logOutput(framework);
            status.textContent = `Loaded kodim23_etc1s.ktx2 (${parrots.size[0]}×${parrots.size[1]}, ${parrots.textureFormat}).`;
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
