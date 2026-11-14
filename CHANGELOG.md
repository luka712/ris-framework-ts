# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
An unreleased version is dated `{{YYYY-MM-DD}}`; the publish pipeline fills in the date when it is merged to `main`.

## [0.4.0] - {{YYYY-MM-DD}}

Compared with 0.3.0.

### Breaking changes

- `WindowManager` is now `CanvasManager` (`framework.canvasManager`), and `WindowBounds` is now `CanvasBounds`.
- `framework.initialize()` is removed; use `initializeAsync()`. `framework.renderingBackend` is removed; use `graphicsDevice.api`.
- WebGPU no longer falls back to WebGL; initialization throws when WebGPU is unavailable. `WebGpuRenderer.isSupported()` is removed.
- Textures expose `size: vec2` instead of `width` and `height`; the old `size` byte count is now `vramSize`. `createEmpty` takes a `vec2`, and `createFromKtx2(ktx, textureFormat?, colorSpace?)` replaces the descriptor overload.
- `textureColorSpace` and `renderer.colorSpace` are replaced by `outputColorSpace`, default `OutputColorSpace.NONE`. See [`guides/color-output.md`](guides/color-output.md).
- `TextureFormat` members use wgpu-style names, for example `RGBA8_UNORM` instead of `RGBA_8_UNORM`.
- `ITextureView` is now `ITextureView2D`; texture views are not supported on WebGL2 (check `features.supportsTextureView`).
- `SwapChainDescriptor` is now the `ISwapChainDescriptor` interface.

### Added

- 2D texture arrays on WebGL and WebGPU: `createTexture2DArray`, `createTexture2DArrayFromKtx2` and `content.loadTexture2DArrayAsync`.
- `createWithMipLevels` for 2D textures with your own mip levels.
- `InspectTextureArrayMaterial`, and WebGPU support for `InspectTextureMipsMaterial`.
- `UnlitTextureArrayMaterial` (`materialFactory.createUnlitTextureArrayMaterial()`): an unlit material that samples one `layer` of a texture array.
- Compressed texture arrays on WebGL2 (BC, ETC2 and ASTC when supported; PVRTC throws).
- Mipmap generation for RGBA8 texture arrays on WebGPU, and in `createTexture2DArrayFromKtx2` for single-level uncompressed files (`generateMipmaps` parameter).
- `graphicsDevice.state` lifecycle, plus `supportedTextureFormats` and `supportsTextureFormat()` on device features.
- `#include` in GLSL and WGSL shader modules.
- `texture_array_2d` and `inspect_texture_mips` examples.

### Changed

- Requires `ris-ktx2` ^0.3.0-dev.18.
- KTX2 textures use the color space stored in the file unless one is passed.
- Texture factories validate data sizes and give clearer error messages.

### Fixed

- Examples no longer hang after switching backends several times.
- Running or restarting the event loop no longer starts a second loop, and removing a listener during a frame no longer skips the next one.

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
