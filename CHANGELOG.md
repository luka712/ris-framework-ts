# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
An unreleased version is dated `{{YYYY-MM-DD}}`; the publish pipeline fills in the date when it is merged to `main`.

## [0.4.0] - {{YYYY-MM-DD}}

Compared with 0.3.0.

### Breaking changes

- `IWindowManager`/`WindowManager`/`WindowBounds` are renamed to `ICanvasManager`/`CanvasManager`/`CanvasBounds`, and `IFramework.windowManager` to `IFramework.canvasManager`.
- `IFramework.initialize()` and `IGraphicsDevice.initialize()` are replaced by `initializeAsync()`.
- There is no silent backend fallback: requesting WebGPU where it is unavailable makes initialization throw instead of falling back to WebGL. The static `WebGpuRenderer.isSupported()` is removed.
- `IGraphicsDevice.createSwapChain(canvas, descriptor)` takes the canvas and an `ISwapChainDescriptor` interface (all fields optional); the `SwapChainDescriptor` class is removed.
- Textures expose `size: vec2` instead of `width`/`height`, and `vramSize` for the GPU byte count. `textureFactory.createEmpty` takes the size as a `vec2`.
- `textureFactory.createFromKtx2(ktx, textureFormat?, colorSpace?)` replaces the descriptor overload.
- Color output: `IRenderer.colorSpace` and the `textureColorSpace` option are replaced by `outputColorSpace` (default `OutputColorSpace.NONE`). sRGB encoding happens once at present: in the blit shader on WebGL, through a native sRGB texture view on WebGPU. See [`guides/color-output.md`](guides/color-output.md).
- `ITextureView`/`TextureViewDescriptor` are replaced by `ITextureView2D`/`ITextureViewDescriptor`. Texture views are unsupported on WebGL2 (requesting one throws); check `graphicsDevice.features.supportsTextureView`.
- `TextureFormat` members use wgpu-style upper-snake-case names (formats wgpu lacks, such as PVRTC, follow the same style).
- Shader modules use `#include` instead of `#import` (GLSL and WGSL).
- Texture usage flags are taken as given; the factories no longer add usages on their own.

### Added

- 2D texture arrays on WebGL and WebGPU: `ITexture2DArray`, `textureFactory.createTexture2DArray`, `createTexture2DArrayFromKtx2` and `content.loadTexture2DArrayAsync` (images, or a single `.ktx2` array file). Compressed formats are block-aligned.
- `textureFactory.createWithMipLevels` to create a 2D texture from your own mip levels.
- `InspectTextureArrayMaterial` and `InspectTextureMipsMaterial` with WebGL and WebGPU pipelines, to show one layer or one mip level of a texture.
- `IGraphicsDevice.state`: graphics devices track their life cycle (`CREATED` → `INITIALIZED`, `DISPOSING` → `DISPOSED`) like textures and meshes; initializing twice throws and disposing twice does nothing.
- Graphics device features: `supportedTextureFormats`, `supportsTextureFormat(format)` and `supportsTextureView`.
- WebGPU utilities (texture, view, sampler, shader module, bind group, pipeline, command encoder).
- WebGL debugging through Spector.js when `debugContext` is set; it is loaded on demand and wraps the canvas before the context is created.
- Examples: `texture_array_2d` and `inspect_texture_mips` (`kodim23.ktx2` with a mip level dropdown); all examples switch between WebGL and WebGPU at runtime.
- [`ai-guide/CONVENTIONS.md`](ai-guide/CONVENTIONS.md) with the project's coding conventions.

### Changed

- Requires `ris-ktx2` ^0.3.0-dev.18.
- KTX2 textures follow the file's color space; an explicit color space overrides it, and the final format is checked against the device.
- The default 1×1 white textures are owned and disposed by the backend texture factories.
- Texture factories validate pixel data length per level and layer, and error messages name the class, method, offending value and what was expected.
- Shader registries are consolidated, and shader modules support includes.

### Fixed

- Switching backends repeatedly no longer hangs: WebGL contexts are released on dispose, a WebGPU device disposed mid-initialization is destroyed, and the framework does not start its loop after being disposed.
- `CanvasManager` no longer starts a second event loop when run twice or restarted, and a listener removing itself no longer skips the next listener.
- WebGPU swap-chain views and texture formats use sRGB when the output is sRGB.
- A non-breaking space in `inspect_texture_array.wgsl` broke WGSL parsing.

## [0.3.0] - {{YYYY-MM-DD}}

Compared with 0.2.0.

### Breaking changes

- Renderable meshes take their transform from `mesh.transform` (a `TransformNode`); `mesh.position`, `rotation`, `scale` and `modelMatrix` are removed.
- Cameras have a `transform`; the `eye`, `target` and `up` properties are replaced by `setEye`/`setTarget`/`setUp` and their getters.
- `PointLight.position` is replaced by `setPosition`/`getPosition`, and `DirectionalLight.direction` by `setDirection`/`getDirection`.
- `ICameraMaterial` is removed; use `IMaterial.camera`.
- `IRenderer.preferredColorSpace` is renamed to `IRenderer.colorSpace`, and the `textureColorSpace` default is now `LINEAR`.
- `PrimitiveStateDescriptor` class is replaced by the `IPrimitiveStateDescriptor` interface; all fields are optional and default to back-face culled, counter-clockwise triangles.
- `UnlitMaterialDescriptor` class is replaced by the `IUnlitMaterialDescriptor` interface (all fields optional).

### Added

- `TransformNode` (with a `Node` parent/child hierarchy), `ISceneObject` and `scene.nodes`; meshes, cameras and lights are scene objects, and parented ones work in world space.
- The `ILight` interface shared by all lights.
- `IMaterial.camera`: materials bind the camera buffers they use.
- `IRenderer.colorSpace` can be switched at runtime.
- `ITextureDescriptor.preferredColorSpace` to choose the color space per texture.

### Changed

- `textureFactory.create` without a format follows the renderer's color space.
- Basis KTX2 textures can be transcoded to PVRTC1 RGB.
- Requires `ris-ktx2` ^0.2.0 (stable).

### Fixed

- `ColorSpace` was not exported from the package entry.
- An explicit `textureFormat` was ignored when loading KTX2 textures.
- `content.loadTexture2DAsync` ignored the descriptor's label and usage.
- ASTC textures were uploaded with the wrong size.
- `OrbitCamera` zoom now checks the real eye-to-target distance against the near and far planes.

## [0.2.0] - 2026-11-01

Compared with `main` (0.1.0).

### Breaking changes

- `FrameworkConfiguration` is no longer exported; pass an `IFrameworkConfiguration` object to `new Framework(...)`.
- `tsyringe` and `reflect-metadata` are removed; services use plain constructor wiring.
- `cameraFactory.createPerspectiveCamera` takes a descriptor object, and every `ICamera` now requires a `positionBuffer`.
- Meshes are split into `IMesh`/`Mesh` (geometry and buffers) and `IRenderableMesh`/`RenderableMesh` (material, index range, sub meshes, transform).
- Materials take a `modelBuffer` owned by the mesh instead of `modelMatrix`, and `renderMesh` takes an `IRenderableMesh`.
- Render pipelines throw when no model buffer is passed.
- Requires `ris-ktx2` 0.2.
- `TextureDescriptor` class is replaced by the `ITextureDescriptor` interface; all fields are optional and factories fill in defaults.

### Added

- `Scene` with `add`/`remove` for meshes, lights and the camera, plus `SceneMesh` for owning a mesh and its materials.
- Lights: `AmbientLight`, `DirectionalLight` and `PointLight`.
- `ForwardBlinnPhongMaterial`, `SpriteMaterial`, and the `ICameraMaterial`/`ILightsMaterial` interfaces.
- Mesh transforms (`position`, `rotation`, `scale`) and sub meshes (`addSubMesh`, `meshFactory.createWithSubMeshes`).
- OBJ/MTL loading through `framework.objLoader`, `ObjParser`, and `content.loadMeshAsync`, `loadUnlitMeshAsync` and `loadBlinnPhongMeshAsync`.
- `geometryBuilder.create(descriptor)` and the exported `BaseGeometry`.
- sRGB compressed texture formats (BC1, BC3, BC7, ETC2), with KTX2 loading choosing sRGB automatically.
- `ColorSpace` enum, the `textureColorSpace` configuration option (default `SRGB`) and `IRenderer.preferredColorSpace`.
- `TextureUtilities.convertToSrgbVariant`, `convertToLinearVariant` and `isSrgbFormat`.
- Examples: `unlit_mesh`, `blinn_phong_mesh` and `sprite_batch`.

### Changed

- `content.loadShaderModule` accepts optional replacement values.
- Textures without a format, and KTX2 textures, follow the configured color space.

### Fixed

- Sprites rendered white because of a stray value in the sprite shader.
- The orthographic camera's default eye was on the wrong side (z = -1).
- A second `Framework` instance reused the default texture and anisotropic-filtering extension from the first.
- A leftover `debugger` statement in WebGL device initialization.
- Swapped BC/S3TC compression flags could select BC7 on GPUs without BPTC support.

## [0.1.0] - 2026-10-08

- Initial release setup. `development` publishes a prerelease on the npm `next` tag. `main` publishes this version on `latest`.
- The package entry is compiled JavaScript and declarations in `dist`. Consumers import `Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and the types formerly published as `ris-framework-api` from `ris-framework` without compiling this repository. Built-in shaders and the browser KTX2 loader are included in that JavaScript.
- `ris-framework-api` is merged into this package under `src/api`. `ris-ktx2` is the only KTX dependency and also provides the KTX2 types; `ris-ktx2-api` is no longer used.
- `FrameworkConfiguration` adds `alpha` and `powerPreference`. `PowerPreferenceType` is exported from the package entry.
- The package license is Apache License 2.0. Copyright 2026 Luka Erkapic.
