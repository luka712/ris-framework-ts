# ris-framework

A browser WebGL2 framework for TypeScript, published as an ES module (version 0.2.0). Runtime dependencies are `gl-matrix` and `ris-ktx2`.

```sh
npm install ris-framework
```

Everything public is exported from the package entry: `Framework`, `TextureSamplerFilteringPreset`, and the API types (scenes, meshes, materials, lights, cameras, textures, loaders, input).

## Create and start a framework

Pass an `IFrameworkConfiguration` object. Every field is optional.

```ts
import { Color, Framework, type IFrameworkConfiguration, TextureSamplerFilteringPreset } from "ris-framework";

const config: IFrameworkConfiguration = {
    canvas: document.querySelector<HTMLCanvasElement>("#game-canvas")!,
    textureFiltering: TextureSamplerFilteringPreset.BILINEAR,
    useKtx2: true,
};

const framework = new Framework(config);

framework.addOnLoadContentListener(async () => { /* load content */ });
framework.addOnUpdateListener(time => { /* update, time.deltaTimeSec */ });
framework.addOnRenderListener(() => { /* draw */ });

framework.initialize();
framework.renderer.clearColor = Color.cornerFlowerBlue();
```

| Field | Default | Meaning |
| --- | --- | --- |
| `canvas` | created and appended | The canvas to render into. |
| `backBufferSize` | `800 × 600` | Back buffer size. |
| `textureFiltering` | `BILINEAR` | Default sampler preset. |
| `textureColorSpace` | `SRGB` | Default texture colour space. |
| `useKtx2` | `false` | Creates `framework.ktx2Factory`. |
| `alpha` | `false` | Whether the back buffer has an alpha channel. |
| `powerPreference` | `DEFAULT` | GPU preference on multi-GPU systems. |

Register listeners before `initialize()`. Load-content and initialized listeners run inside that call.

## Scenes, cameras and lights

```ts
import { Color, DirectionalLight, PointLight, Scene } from "ris-framework";

const scene = new Scene(framework);

// Passing the scene makes this the scene's camera.
const camera = framework.cameraFactory.createPerspectiveCamera({
    aspectRatio: canvas.width / canvas.height,
    eye: [0, 0, 3],
}, scene);

scene.activeAmbientLight.color = new Color(0.4, 0.4, 0.4);
// Lights take an optional scene; passing it adds them.
new DirectionalLight({ color: new Color(1, 1, 1), intensity: 0.8, direction: [-0.4, -0.6, 1] }, scene);
new PointLight({ color: new Color(1, 0.5, 0.2), intensity: 1.2, linear: 0.35, quadratic: 0.44 }, scene);

framework.addOnUpdateListener(time => {
    camera.update(time);
    scene.update(time);
});
framework.addOnRenderListener(() => scene.render());
```

`scene.add(item)` and `scene.remove(item)` accept a renderable mesh, a `SceneMesh`, a light or a camera. Blinn-Phong materials support up to 3 directional and 5 point lights.

## Meshes and materials

- `IMesh` / `Mesh` hold geometry and the vertex and index buffers.
- `IRenderableMesh` / `RenderableMesh` add a material, an index range and sub meshes (`mesh.addSubMesh(material, start, count)` or `meshFactory.createWithSubMeshes`). The root mesh owns the transform and one model buffer, which all its sub meshes share.
- Transforms: `mesh.position`, `mesh.rotation` (Euler radians, applied Y, then X, then Z) and `mesh.scale`. `mesh.modelMatrix` is recomputed only when one of them changes.
- `SceneMesh`: `scene.add(mesh)` wraps a renderable mesh in a `SceneMesh`, which owns its materials. `sceneMesh.dispose()` and `scene.dispose()` dispose the mesh and each material once.
- Materials come from `framework.materialFactory`. They include unlit, `ForwardBlinnPhongMaterial` and `SpriteMaterial`.

## Loading OBJ/MTL

```ts
// Unlit or Blinn-Phong materials (one per usemtl), coloured from the .mtl.
const cube = await framework.content.loadBlinnPhongMeshAsync("/assets/cube.obj", camera);
const flat = await framework.content.loadUnlitMeshAsync("/assets/cube.obj", camera);
scene.add(cube);

// Lower level: pass a Blinn-Phong descriptor or a material factory per sub mesh.
const mesh = await framework.objLoader.loadAsync("/assets/cube.obj", {
    projectionViewBuffer: camera.projectionViewBuffer,
    cameraPositionBuffer: camera.positionBuffer,
});

// Geometry only, with no materials (GeometryFormat is exported from "ris-framework").
const geometry = await framework.content.loadMeshAsync("/assets/cube.obj", GeometryFormat.POS3_COLOR4_TEXTURECOORDS2);
```

`ObjLoader.parseAsync(path)` and `ObjParser` return plain data without creating GPU resources.

## Textures and KTX2

```ts
const png = await framework.content.loadTexture2DAsync("/assets/test.png");
const ktx = await framework.content.loadTexture2DAsync("/assets/kodim23.ktx2");
```

Paths ending in `.ktx2` are loaded through `ris-ktx2`.

- **Basis Universal files** are transcoded to the best format the GPU supports, in this order: BC7, ASTC 4×4, BC3, ETC2, PVRTC, and RGBA8 as a last resort.
- **Other KTX2 files** are uploaded in their stored format.
- **sRGB:** sRGB files load as sRGB formats (`BC7_RGBA_SRGB`, `BC3_RGBA_SRGB`, `BC1_RGB_SRGB`, `ETC2_RGBA8_SRGB`, `ETC2_RGB8_SRGB`, `ASTC_*_RGBA_SRGB`, `RGBA_8_UNORM_SRGB`), so the GPU decodes them to linear.
- **sRGB fallback:** if `WEBGL_compressed_texture_s3tc_srgb` is missing, sRGB BC1 and BC3 textures fall back to linear with a warning.

`framework.graphicsDevice.features` reports compression support: `supportsTextureCompressionBC` (BPTC/BC7), `supportsTextureCompressionS3TC`, `supportsTextureCompressionS3TCSrgb`, `supportsTextureCompressionETC2`, `supportsTextureCompressionASTC` and `supportsTextureCompressionPVRTC`.

## Sprites

```ts
framework.addOnRenderListener(() => {
    framework.spriteBatch.begin();
    framework.spriteBatch.draw(texture, new Rect(200, 200, 200, 200), Color.white());
    framework.spriteBatch.drawRect(new Rect(500, 200, 100, 100), Color.blue());
    framework.spriteBatch.end();
});
```

## Examples and scripts

Examples live in [`examples/`](examples/): `unlit_mesh`, `blinn_phong_mesh` and `sprite_batch` (see [`examples/README.md`](examples/README.md)).

```sh
npm ci
npm run dev:examples     # serve the examples
npm run build:examples   # build them into examples/dist/
npm run dev              # src/main.ts playground
npm test                 # type-check and Vitest
npm run build            # library (dist/) and app build
```

Requires Node.js 22 (or `^20.19.0`) and a WebGL2-capable browser.

## Known limitations

- Window resize listeners and compute passes throw `Method not implemented.`
- Keyboard and gamepad state are stubs.
- `SpriteBatch` ignores rotation.

Branch and publish rules are in [CONTRIBUTING.md](CONTRIBUTING.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).
