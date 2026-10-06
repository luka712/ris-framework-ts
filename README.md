# ris-framework

`ris-framework` is a browser WebGL2 framework, published as an ES module. Version 0.1.0. An application imports the compiled package. This repository also contains a sample page that runs the framework.

Open `index.html`. The module script is `src/main.ts`. That file builds the page, constructs a `Framework`, and starts the frame loop. Shared interfaces and value types (`IFramework`, `Color`, `Rect`, `TextureDescriptor`, and the rest) come from the `ris-framework-api` package. This repository implements them.

## Layout

| Path | What lives there |
| --- | --- |
| `index.html` | The page. It has `#app` and `<canvas id="game-canvas" width="800" height="600">`. |
| `src/main.ts` | Application entry. |
| `src/core` | `Framework`, `FrameworkConfig`, the window and input managers, content loading, the renderer base, and the sprite batch. |
| `src/webgl` | The WebGL2 graphics device, renderer, textures, buffers, samplers, and render pipelines. |
| `src/geometry` | `GeometryBuilder` and mesh geometry data. |
| `src/content` | Built-in shader modules. GLSL is imported from `shaders/glsl`. |
| `shaders/glsl` | Vertex and fragment shaders used by those built-in modules. |
| `examples/load_and_show_ktx2` | Browser page that loads `ktx_logo_200.ktx2` and draws it with the sprite batch. `npm run dev` does not serve this page. |

Runtime dependencies are `ris-framework-api`, `ris-ktx2-api`, `gl-matrix`, `tsyringe`, and `reflect-metadata`. The library build also includes the browser portion of `ris-ktx2`, with its Node loader replaced by a stub, so the published entry does not import Node built-ins. TypeScript, Vite, and `ris-ktx2` are dev dependencies. Notices for the bundled KTX loader are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

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
import { Framework, FrameworkConfig, TextureSamplerFilteringPreset } from "ris-framework";
```

`Framework`, `FrameworkConfig`, and `TextureSamplerFilteringPreset` are that public surface. Built-in GLSL is compiled into `dist/index.js`, so a consumer does not load this repository's `shaders/` directory at runtime. The same file includes the browser KTX2 loader. A consuming Vite app can import the package and build without adding a Node stub of its own.

To work in this repository:

```sh
npm ci
```

Import `reflect-metadata` before constructing the framework. `src/main.ts` keeps that import first. `Framework` registers itself on a tsyringe child container, and tsyringe expects `reflect-metadata` to be loaded.

## Create a framework instance

Construct `FrameworkConfig`, then pass it to `Framework`. The constructor is `constructor(options: FrameworkConfig | null = null)`. Omitting the argument, or passing `null`, uses `new FrameworkConfig()`.

Another project imports that public entry by package name: `import { Framework, FrameworkConfig, TextureSamplerFilteringPreset } from "ris-framework"`.

No config field is required. Each field has a default.

| Field | Default | What the code does with it |
| --- | --- | --- |
| `canvas` | `null` | The canvas the WebGL2 context is created from. `null` makes `WindowManager` create a canvas and append it to `document.body`. `src/main.ts` sets this to `#game-canvas`. |
| `backBufferSize` | `vec2.fromValues(800, 600)` | Copied onto an internal `RenderConfiguration`. `WebGlRenderer` leaves that copy unused. The main render target starts at the canvas element's `width` and `height`. The canvas in `index.html` is 800 by 600. |
| `textureFiltering` | `TextureSamplerFilteringPreset.BILINEAR` | Preset for the graphics device's default texture sampler. `POINT` is nearest filtering with no mipmaps. `BILINEAR` is linear filtering with no mipmaps. `TRILINEAR` is linear filtering with linear mipmaps. `undefined` is treated as `BILINEAR`. |
| `useKtx2` | `false` | When `true`, the constructor sets `framework.ktx2Factory` to a `Ktx2Factory`. `initialize()` then calls `initializeAsync()` on it and does not wait. When `false`, `ktx2Factory` stays unset. |

`textureFiltering` is declared optional on `FrameworkConfig`. The other three fields are always present on a new config object.

```ts
import "reflect-metadata";

import { Framework, FrameworkConfig, TextureSamplerFilteringPreset } from "ris-framework";

const config = new FrameworkConfig();
config.canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
config.textureFiltering = TextureSamplerFilteringPreset.BILINEAR;

const framework = new Framework(config);
```

`src/main.ts` constructs the sample the same way, but it imports those three symbols from the source files under `src/` instead of from the package name.

`framework.renderingBackend` is `RenderingBackend.WEB_GL`. After `initialize()`, `framework.graphicsDevice` is the renderer's WebGL2 device.

## Run, build, and preview

```sh
npm run dev
```

`dev` runs Vite. The served page is `index.html`. The sample imports the framework from `src/`.

```sh
npm run build
```

`build` typechecks `src` and `examples/load_and_show_ktx2/main.ts`, then writes:

- The library, which is what `npm publish` ships. Vite compiles `src/index.ts` to `dist/index.js` and includes the built-in shader sources in that file. It also bundles `ris-ktx2` after replacing that package's Node loader with the browser stub from `vite.config.ts`. `gl-matrix`, `reflect-metadata`, `ris-framework-api`, `ris-ktx2-api`, and `tsyringe` stay as imports. `tsc` writes `dist/index.d.ts` and the declaration files it references. `package.json` `main`, `module`, `types`, and `exports` point at `dist`.
- The sample page. `vite build` writes it to `dist-app/`. The sample Vite config replaces `ris-ktx2`'s Node loader with a browser stub so that bundle does not import Node built-ins.
- The KTX2 example. `build:load-and-show-ktx2` writes it to `examples/load_and_show_ktx2/dist/`.

```sh
npm run preview
```

`preview` runs `vite preview` and serves the `dist-app/` build.

```sh
npm run dev:load-and-show-ktx2
```

Serves `examples/load_and_show_ktx2/index.html` on its own Vite root. That page sets `useKtx2`, waits for `ktx2Factory.initializeAsync()`, then calls `content.loadTexture2DAsync` with the bundled URL of `ktx_logo_200.ktx2` and draws the texture through `spriteBatch`. The root sample at `index.html` is unchanged.

```sh
npm run build:load-and-show-ktx2
```

Writes that page to `examples/load_and_show_ktx2/dist/`. `npm run build` runs this after the library and the root sample. The directory is gitignored with the other `dist/` outputs.

```sh
npm test
```

`test` runs `tsc --noEmit`. It typechecks `src` and `examples/load_and_show_ktx2/main.ts`.

## From startup to the first frame

`src/main.ts` is the current startup path. It still fills `#app` with the Vite starter page (logos and a counter) and then starts the framework on `#game-canvas`.

Register listeners before `initialize()`. Load-content and initialized listeners run only inside that call. Update and render listeners stay on the loop, so a listener added later still runs on a following frame. `initialize()` does this:

1. Starts KTX2 initialization when `useKtx2` is set, without awaiting it.
2. Creates the WebGL2 context, swap chain, and default sampler, blend state, and primitive state.
3. Initializes the sprite batch (a default orthographic camera and a 1×1 white texture).
4. Initializes input. Mouse move, mouse buttons, and wheel events on the canvas update `framework.input.getMouseState()`. Touch start, move, end, and cancel events on the canvas update `framework.input.getTouchCollection()`, using the same viewport `clientX` / `clientY` coordinates as the mouse. The canvas `touch-action` is set to `none`, and touch start and move call `preventDefault`, so the browser does not scroll or pinch-zoom that canvas.
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
} from "ris-framework-api";

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
- Paths ending in `.ktx2` go through `content.loadKtx2Async`, which uses its own `Ktx2Factory` and does not call `initializeAsync`. `loadAsync` needs the KTX module that `useKtx2` starts, and `initialize()` does not wait for that call. The `.ktx2` branch of `loadTexture2DAsync` also drops `ContentConfig`. `src/main.ts` does not load a `.ktx2` file. `examples/load_and_show_ktx2/main.ts` awaits `ktx2Factory.initializeAsync()` before `initialize()` so the load listener can call `loadTexture2DAsync` on `ktx_logo_200.ktx2`.
- The geometry and unlit-pipeline steps at the bottom of `src/main.ts` are comments. `geometryBuilder.quadGeometry()` can build quad data; the entry file does not upload it or draw it.

## Version

`package.json` `version` stays a release version with no prerelease suffix. It is `0.1.0`. Branch and publish rules are in [CONTRIBUTING.md](CONTRIBUTING.md).
