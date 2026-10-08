# ris-framework

`ris-framework` is a browser WebGL2 framework, published as an ES module. Version 0.1.0. An application imports the compiled package. This repository also contains a sample page that runs the framework.

Open `index.html`. The module script is `src/main.ts`. That file builds the page, constructs a `Framework`, and starts the frame loop. Shared interfaces and value types (`IFramework`, `Color`, `Rect`, `TextureDescriptor`, and the rest) ship from this package. They used to live in `ris-framework-api`. This repository implements them.

## Layout

| Path | What lives there |
| --- | --- |
| `index.html` | The page. It has `#app` and `<canvas id="game-canvas" width="800" height="600">`. |
| `src/main.ts` | Application entry. |
| `src/index.ts` | Package entry. Exports `Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and everything under `src/api`. |
| `src/Framework.ts` | `Framework`, which wires the renderer, factories, managers, and the frame loop together. |
| `src/api` | Interfaces and value types formerly published as `ris-framework-api` (input, textures, cameras, `TextureUtilities`, and the rest). It also holds `FrameworkConfiguration` and the backend-independent implementations: `WindowManager`, `InputManager`, `ContentManager`, `SpriteBatch`, `GeometryBuilder`, and `BaseGeometry`. `src/api/content/ShaderModuleContent.ts` maps the built-in shader module ids to GLSL from `shaders/glsl`. |
| `src/core` | Renderer and graphics-device base classes (`ARenderer`, `AGraphicsDevice`), the texture base class, blend and sampler descriptors, `VertexBufferLayout`, and `TextureSamplerFilteringPreset`. |
| `src/webgl` | The WebGL2 graphics device, renderer, textures, buffers, samplers, and render pipelines. |
| `shaders/glsl` | Vertex and fragment shaders used by the built-in shader modules. |
| `tests` | Vitest tests for the types under `src/api`. |

Runtime dependencies are `ris-ktx2`, `gl-matrix`, `tsyringe`, and `reflect-metadata`. The KTX2 types (`IKtx2Texture`, `VkFormat`, `KtxTranscodeFormat`, and the rest) are imported from `ris-ktx2`. The library build includes the browser portion of `ris-ktx2`, with its Node loader replaced by a stub, so the published entry does not import Node built-ins. TypeScript, Vite, and Vitest are dev dependencies. Notices for the bundled KTX loader are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The package license is Apache License 2.0. Copyright 2026 Luka Erkapic. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Prerequisites

- Node.js 22. Continuous integration uses Node.js 22. Vite 7 in this repo requires `^20.19.0` or `>=22.12.0`.
- npm.
- A browser that can create a WebGL2 context. If `canvas.getContext("webgl2")` fails, startup throws `WebGL not supported.`

## Install

Install the package in an application:

```sh
npm install ris-framework
```

The published entry is compiled JavaScript and TypeScript declarations (`dist/index.js` and `dist/index.d.ts`). Import the public surface by package name:

```ts
import { Framework, FrameworkConfiguration, TextureSamplerFilteringPreset } from "ris-framework";
```

The same entry re-exports the former `ris-framework-api` surface, so a consumer can import those names from `ris-framework`:

```ts
import { Color, Rect, TextureFormat, TextureUtilities, type IInputManager } from "ris-framework";
```

`Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and that API surface are the public entry. Built-in GLSL is compiled into `dist/index.js`, so a consumer does not load this repository's `shaders/` directory at runtime. The same file includes the browser KTX2 loader. A consuming Vite app can import the package and build without adding a Node stub of its own.

To work in this repository:

```sh
npm ci
```

Import `reflect-metadata` before constructing the framework. `src/main.ts` keeps that import first. `Framework` registers itself on a tsyringe child container, and tsyringe expects `reflect-metadata` to be loaded.

## Create a framework instance

Construct `FrameworkConfiguration`, then pass it to `Framework`. The constructor is `constructor(options?: IFrameworkConfiguration)`. Omitting the argument uses `new FrameworkConfiguration()`. The constructor writes the resolved `backBufferSize` back onto the object you pass.

Another project imports that public entry by package name: `import { Framework, FrameworkConfiguration, TextureSamplerFilteringPreset } from "ris-framework"`.

No config field is required. Each field has a default.

| Field | Default | What the code does with it |
| --- | --- | --- |
| `canvas` | `undefined` | The canvas the WebGL2 context is created from. When unset, `Framework` logs a warning and `WindowManager` creates a canvas and appends it to `document.body`. `src/main.ts` sets this to `#game-canvas`. |
| `backBufferSize` | `undefined` (the constructor uses `vec2.fromValues(800, 600)`) | Copied onto an internal `IRendererConfiguration`. `WebGlRenderer` leaves that copy unused. The main render target starts at the canvas element's `width` and `height`. The canvas in `index.html` is 800 by 600. |
| `textureFiltering` | `TextureSamplerFilteringPreset.BILINEAR` | Preset for the graphics device's default texture sampler. `POINT` is nearest filtering with no mipmaps. `BILINEAR` is linear filtering with no mipmaps. `TRILINEAR` is linear filtering with linear mipmaps. `undefined` is treated as `BILINEAR`. |
| `useKtx2` | `false` | When `true`, the constructor sets `framework.ktx2Factory` to a `Ktx2Factory`. `initialize()` then calls `initializeAsync()` on it and does not wait. When `false`, `ktx2Factory` stays unset. |
| `alpha` | `false` | Passed as the WebGL2 context's `alpha` attribute, so it decides whether the canvas back buffer has an alpha channel. |
| `powerPreference` | `PowerPreferenceType.DEFAULT` | Passed as the WebGL2 context's `powerPreference` (`"default"`, `"low-power"`, or `"high-performance"`). It only matters on machines with more than one GPU. |

Every field is optional on `IFrameworkConfiguration`. A new `FrameworkConfiguration` sets `useKtx2`, `textureFiltering`, `alpha`, and `powerPreference`. `canvas` and `backBufferSize` start unset.

```ts
import "reflect-metadata";

import { Framework, FrameworkConfiguration, TextureSamplerFilteringPreset } from "ris-framework";

const config = new FrameworkConfiguration();
config.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
config.textureFiltering = TextureSamplerFilteringPreset.BILINEAR;

const framework = new Framework(config);
```

`src/main.ts` constructs the sample the same way, but it imports those three symbols from the source files under `src/` instead of from the package name.

`framework.renderingBackend` is `RenderingBackend.WEB_GL`. After `initialize()`, `framework.graphicsDevice` is the renderer's WebGL2 device.


## From startup to the first frame

`src/main.ts` is the current startup path. It still fills `#app` with the Vite starter page (logos and a heading) and then starts the framework on `#game-canvas`.

Register listeners before `initialize()`. Load-content and initialized listeners run only inside that call. Update and render listeners stay on the loop, so a listener added later still runs on a following frame. `initialize()` does this:

1. Starts KTX2 initialization when `useKtx2` is set, without awaiting it.
2. Creates the WebGL2 context, swap chain, and default sampler, blend state, and primitive state.
3. Initializes the sprite batch (a default orthographic camera and a 1×1 white texture).
4. Initializes input. Mouse move, mouse buttons, and wheel events on the canvas update `framework.input.getMouseState()`. Touch start, move, end, and cancel events on the canvas update `framework.input.getTouchCollection()`, using the same viewport `clientX` / `clientY` coordinates as the mouse. A cancel is `TouchLocationState.CANCELLED`, which is not a finger lift. The canvas `touch-action` is set to `none`, and touch start and move call `preventDefault`, so the browser does not scroll or pinch-zoom that canvas.
5. Prepares the time manager.
6. Calls every `addOnLoadContentListener` callback. Async callbacks are not awaited.
7. Calls every `addOnInitializedListener` callback.
8. Creates the main render target at the canvas size and a swap-chain pass. The clear color at this moment is `Color.lightPink()`, the renderer default.
9. Subscribes an update callback and a render callback, then runs both once before returning. Later frames are scheduled with `requestAnimationFrame`.

Each update calls `timeManager.frameStart()`, updates input, then calls `addOnUpdateListener` callbacks with that frame's `GameTime`. `src/main.ts` registers no update listener. Each render begins the main pass, calls `addOnRenderListener` callbacks, calls `spriteBatch.frameEnd()`, and presents.

Before that call, `src/main.ts` registers the listeners below. The sample loads images, creates a nearest sampler, and draws with the sprite batch:

```ts
import {
  Color,
  Rect,
  SamplerDescriptor,
  SamplerFilter,
  TextureDescriptor,
  TextureFormat,
  type ISampler,
  type ITexture2D,
} from "ris-framework";

const rect = new Rect(200, 200, 200, 200);
const texRect = new Rect(500, 200, 200, 200);
const color = Color.blue();
const white = Color.white();
let tex: ITexture2D;
let sampler: ISampler;

framework.addOnLoadContentListener(async () => {
  const texDesc = new TextureDescriptor();
  texDesc.generateMipmaps = true;
  texDesc.textureFormat = TextureFormat.RGBA_8_UNORM;

  tex = await framework.content.loadTexture2DAsync("/assets/test.png", texDesc);
});

framework.addOnInitializedListener(() => {
  const desc = new SamplerDescriptor();
  desc.minFilter = SamplerFilter.NEAREST;
  desc.magFilter = SamplerFilter.NEAREST;
  sampler = framework.graphicsDevice.createSampler(desc);
});

framework.addOnRenderListener(() => {
  const spriteBatch = framework.spriteBatch;
  spriteBatch.begin(undefined, sampler);
  spriteBatch.drawRect(rect, color);
  if (tex != null) {
    spriteBatch.draw(tex, texRect, white);
  }
  spriteBatch.end();
});

framework.initialize();
framework.renderer.clearColor = Color.lightPink();
```

`loadTexture2DAsync(path, textureDescriptor?, contentConfig?)` is the image path used above. For a path that does not end in `.ktx2`, the descriptor's `textureFormat` is used when it is not `TextureFormat.UNDEFINED`; otherwise the renderer's preferred format is used. `generateMipmaps` is passed through. Width, height, pixel data, usage, label, and block size on that descriptor are not applied to this load. An optional `ContentConfig` only forwards `keepDataCached` to the image loader.

The first `begin` / `drawRect` / `end` runs inside `initialize()`, before the texture promise resolves, so the blue rectangle is the first draw. Later frames draw the texture once `tex` is set. `spriteBatch.begin` with no matrix keeps the default orthographic camera. The sampler argument overrides the device's default sampler for that batch. `drawRect` draws the 1×1 white texture tinted by `color`.

`src/main.ts` also loads `/assets/cat.jpg` the same way and draws it at `new Rect(200, 500, 200, 200)`. Those two files are absent from this repository. Put them under `public/assets/` before those loads can succeed. The blue rectangle still draws when the image loads fail.

Setting `framework.renderer.clearColor` after `initialize()` updates later frames. The first frame has already cleared with the default light pink.

## What is still unfinished

These throw, or they accept a call and do not do the work the name suggests:

- `WindowManager.addOnResizeListener`, `removeOnResizeListener`, `initializeForWebGPU`, `initializeForWebGl`, and `dispose` throw `Method not implemented.` `title` and `windowBounds` are stored and never applied. There is no WebGPU backend.
- `Framework.dispose()` is empty. It does not release the window, device, or GPU resources.
- `renderer.beginComputePass()` and `renderer.endComputePass()` throw `Method not implemented.` `ARenderer.limits` throws the same error.
- `graphicsDevice.setupDebugCallback()`, `frameEnd()`, `pushDebugGroup()`, and `popDebugGroup()` throw `Method not implemented.`
- `ITexture2D.createView()` throws `Method not implemented.`
- `content.loadShaderModule` only resolves the built-in ids `sprite`, `unlit_material`, `inspect_texture_mips`, and `main_render_target_flip_y`. Any other id throws `Not implemented`.
- `SpriteBatch.draw` and `drawRect` accept rotation arguments and do not use them. `layerDepth` is written as the sprite's z position.
- Keyboard and gamepad queries return empty state. `getKeyboardState()` is an empty `KeyboardState`. `getGamePadState()` is a disconnected `GamePadState`. `thumbstickDeadZone` is stored and not applied.
- A render pass that enables stencil without depth throws `Not implemented`.
- Paths ending in `.ktx2` go through `content.loadKtx2Async`, which uses its own `Ktx2Factory` and does not call `initializeAsync`. The libktx module is shared by every `Ktx2Factory`, so `loadAsync` works only after some factory has finished `initializeAsync()`. `useKtx2` starts that call in `initialize()` but does not wait for it. To load a `.ktx2` file, set `useKtx2`, await `framework.ktx2Factory.initializeAsync()` before `initialize()`, and then call `loadTexture2DAsync` from a load-content listener. `src/main.ts` does not load a `.ktx2` file.
- The geometry and unlit-pipeline steps at the bottom of `src/main.ts` are comments. `geometryBuilder.quadGeometry()` can build quad data; the entry file does not upload it or draw it.

## Version

`package.json` `version` stays a release version with no prerelease suffix. It is `0.1.0`. Branch and publish rules are in [CONTRIBUTING.md](CONTRIBUTING.md).
