import {vec2} from "gl-matrix";
import {runWithBackendSwitcher} from "../shared/backendSwitcher.ts";
import {
    Color,
    Framework,
    MipMapSamplerFilter,
    SamplerDescriptor,
    SamplerFilter,
    RenderingBackend,
    RenderableMesh,
    Scene,
    type GameTime,
    TextureFormat,
    type IFramework,
    type ISampler,
    type ITexture2D,
    type InspectTextureMipsMaterial,
} from "../../src";

const status = document.querySelector<HTMLParagraphElement>("#status")!;

/** The size of mip level 0. A 64×64 texture has 7 mip levels (64, 32, 16, 8, 4, 2, 1). */
const SIZE = 64;

/** One RGB colour per mip level, so every level is easy to tell apart. */
const LEVEL_COLORS: ReadonlyArray<[number, number, number]> = [
    [220, 50, 47],   // 0: red
    [255, 140, 0],   // 1: orange
    [240, 200, 20],  // 2: yellow
    [40, 160, 70],   // 3: green
    [30, 150, 220],  // 4: blue
    [110, 70, 200],  // 5: purple
    [230, 80, 170],  // 6: pink
];

/**
 * Creates the RGBA8 bytes of one mip level: a 4×4 checkerboard of the level's colour and a darker shade
 * (cells shrink with the level; the 2×2 and 1×1 levels are a 2×2 checker and a solid colour).
 */
function createLevel(level: number): Uint8Array {
    const size = Math.max(1, SIZE >> level);
    const cell = Math.max(1, size / 4);
    const [r, g, b] = LEVEL_COLORS[level % LEVEL_COLORS.length];
    const bytes = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dark = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 == 1;
            const shade = dark ? 0.6 : 1;
            const i = (y * size + x) * 4;
            bytes[i] = r * shade;
            bytes[i + 1] = g * shade;
            bytes[i + 2] = b * shade;
            bytes[i + 3] = 255;
        }
    }
    return bytes;
}

runWithBackendSwitcher("#game-canvas", ({canvas, backend}) => {
    const framework: IFramework = new Framework({
        canvas,
        renderingBackend: backend,
    });

    // The scene draws the quads; disposing it disposes the meshes and their materials (not the texture).
    let scene: Scene | undefined;
    let texture: ITexture2D | undefined;
    let sampler: ISampler | undefined;

    framework.addOnLoadContentListener(async () => {
        try {
            const levelCount = Math.floor(Math.log2(SIZE)) + 1;
            const levels: Uint8Array[] = [];
            for (let level = 0; level < levelCount; level++) {
                levels.push(createLevel(level));
            }
            texture = framework.textureFactory.createWithMipLevels(SIZE, SIZE, levels, "ColouredMips",
                undefined, TextureFormat.RGBA8_UNORM);

            // The default sampler has no mipmap filter, which clamps sampling to mip 0. Nearest filtering keeps the checker cells sharp.
            const samplerDescriptor = new SamplerDescriptor();
            samplerDescriptor.minFilter = SamplerFilter.NEAREST;
            samplerDescriptor.magFilter = SamplerFilter.NEAREST;
            samplerDescriptor.mipMapFilter = MipMapSamplerFilter.NEAREST;
            sampler = framework.graphicsDevice.createSampler(samplerDescriptor);

            scene = new Scene(framework);
            // One quad per mip level, left to right, each sampling its level with textureLod / textureSampleLevel.
            const quadSize = 0.22;
            const step = 0.26;
            const firstX = -step * (levelCount - 1) / 2;
            for (let level = 0; level < levelCount; level++) {
                const material: InspectTextureMipsMaterial = framework.materialFactory.createInspectTextureMipsMaterial();
                material.texture = texture;
                material.textureSampler = sampler;
                material.mipLevel = level;
                const mesh = new RenderableMesh(framework, material);
                mesh.setGeometry(framework.geometryBuilder.quadGeometry(vec2.fromValues(quadSize, quadSize)));
                mesh.transform.position[0] = firstX + level * step;
                scene.add(mesh);
            }

            const backendName = backend === RenderingBackend.WEB_GPU ? "WebGPU" : "WebGL";
            status.textContent = `${backendName}: ${SIZE}×${SIZE} texture with ${levelCount} mip levels, one quad per level (0 on the left).`;
        } catch (error) {
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
            sampler?.dispose();
        },
    };
});
