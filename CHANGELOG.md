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
- `renderer.backend` and `renderer.limits` are removed; use `graphicsDevice.api` and `graphicsDevice.limits` (`GpuLimits`). `beginComputePass` and `endComputePass` are removed from the renderer.
- `IGraphicsDevice.createRenderPass` is moved to `IRenderer.createRenderPass`. The renderer also has `mainRenderPass`; queued custom render passes run after the main pass.
- `RenderingBackend` is now `GpuBackend`, and the `renderingBackend` option is now `gpuBackend`.
- `IUniformBuffer.update(data, offset?, length?)` is replaced by `write(data, offset?, length?)` and `writeSingle(value, offset)`, which only fill the buffer's CPU-side copy, and `update()`, which uploads it to the GPU. Offsets and lengths are in floats, not bytes.
- `createFromKtx2` and `createTexture2DArrayFromKtx2` default `generateMipmaps` to false.

### Added

- 2D texture arrays on WebGL and WebGPU: `createTexture2DArray`, `createTexture2DArrayFromKtx2` and `content.loadTexture2DArrayAsync`.
- `createWithMipLevels` for 2D textures with your own mip levels.
- `InspectTextureArrayMaterial`, and WebGPU support for `InspectTextureMipsMaterial`.
- `UnlitTextureArrayMaterial` (`materialFactory.createUnlitTextureArrayMaterial()`): an unlit material that samples one `layer` of a texture array.
- Compressed texture arrays on WebGL2 (BC, ETC2 and ASTC when supported; PVRTC throws).
- Mipmap generation for RGBA8 and RGBA8 sRGB textures and texture arrays, and in `createTexture2DArrayFromKtx2` / `createFromKtx2` for single-level uncompressed files when `generateMipmaps` is true (false by default). On WebGPU, the texture needs `TEXTURE_BINDING | COPY_DST`; the compute shader writes into an internal staging texture. sRGB is filtered in linear space. Other formats throw.
- `graphicsDevice.limits` (`GpuLimits`): max 2D/3D texture size, array layers, uniform buffer size and anisotropy.
- `framework.graphicsDevice`.
- `framework.computeContext` (`IComputeContext`; `null` on WebGL), plus `IComputePass` and `IComputePassDescriptor`. `IComputeContext` has `mainComputePass`, `createComputePass` and `frameEnd`. Queued custom compute passes run after the main compute pass.
- `IRenderer.mainRenderPass` and `createRenderPass`. Custom render passes run after the main render pass.
- `graphicsDevice.mainCommandEncoder`, `createCommandEncoder`, `frameStart` and `frameEnd`. Pass descriptors can take a `commandEncoder`; otherwise the main encoder is used.
- `framework.computePipelineFactory` (`IComputePipelineFactory`; omitted on WebGL) with `createDownsampleTexturePipeline(source, destination)` (both `ITextureView2D`; the pipeline's `target` is that destination) and `createDownsampleTexturePipelineAsync()`, which sets `source` and `target` later.
- `ITextureViewDescriptor` sets `dimension` and can set `baseMipLevel`, `mipLevelCount`, `baseArrayLayer` and `arrayLayerCount`. `createView(descriptor)` creates a view of a mip or layer. `ITextureView2D.size` is the view's pixel size.
- `IDownsampleTextureComputePipeline` (`source`, `target`, `nearestNeighbour`; extends `IComputePipeline` with `initialize`, `dispatch` and `dispatchWorkgroup`). `nearestNeighbour` is false by default, so mips average 2×2 source pixels (bilinear).
- `IGpuCommandEncoder.copyTextureToTexture(source, destination, arrayLayerCount?)`, where each side is an `ITextureCopyRegion` (`texture`, `mipLevel`, `arrayLayer`). WebGL throws "Not implemented".
- `queueDispose()` on 2D textures and texture arrays, and `graphicsDevice.queueDisposable()`: the item is disposed in `frameEnd()`, after the frame is submitted. See [`guides/disposing.md`](guides/disposing.md).
- `canvasManager.addOnResizeListener` and `removeOnResizeListener`, called at the start of a frame when the canvas size changed. The swap chain follows the canvas, and the main render target follows it when `backBufferMatchesSwapChain` is true. See [`guides/resizing.md`](guides/resizing.md).
- `CpuImageProcessor.resizeAsync` and `generateMipmapsAsync` accept raw RGBA8 bytes, not only images.
- `graphicsDevice.state` lifecycle, plus `supportedTextureFormats` and `supportsTextureFormat()` on device features.
- `#include` in GLSL and WGSL shader modules.
- `texture_array_2d` and `inspect_texture_mips` examples.

### Changed

- Requires `ris-ktx2` ^0.3.0-dev.18.
- KTX2 textures use the color space stored in the file unless one is passed.
- Texture factories validate data sizes and give clearer error messages.
- `textureFactory.create` defaults the usage to `TEXTURE_BINDING | COPY_DST`. On WebGPU, uploading an `HTMLImageElement` also needs `RENDER_ATTACHMENT`, which the caller has to pass.
- Generated mips use a bilinear 2×2 average instead of nearest neighbour.
- Texture array mipmaps are built like 2D ones: each mip level is downsampled from the previous level of the same layer.

### Fixed

- Examples no longer hang after switching backends several times.
- Running or restarting the event loop no longer starts a second loop, and removing a listener during a frame no longer skips the next one.
- WebGL no longer renders with a 0×0 viewport.
- Resizing on WebGPU no longer fails with "Destroyed texture used in a submit"; old render targets are disposed after the frame is submitted.
- `CpuImageProcessor.generateMipmapsAsync` no longer adds an extra 0×0 level and keeps non-square levels at least 1 pixel wide and high.

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
