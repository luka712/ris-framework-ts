# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - Unreleased

Compared with `main` (0.1.0).

### Breaking changes

- `FrameworkConfiguration` is no longer exported; pass an `IFrameworkConfiguration` object to `new Framework(...)`.
- `tsyringe` and `reflect-metadata` are removed; services use plain constructor wiring.
- `cameraFactory.createPerspectiveCamera` takes a descriptor object, and every `ICamera` now requires a `positionBuffer`.
- Meshes are split into `IMesh`/`Mesh` (geometry and buffers) and `IRenderableMesh`/`RenderableMesh` (material, index range, sub meshes, transform).
- Materials take a `modelBuffer` owned by the mesh instead of `modelMatrix`, and `renderMesh` takes an `IRenderableMesh`.
- Render pipelines throw when no model buffer is passed.
- Requires `ris-ktx2` 0.2.

### Added

- `Scene` with `add`/`remove` for meshes, lights and the camera, plus `SceneMesh` for owning a mesh and its materials.
- Lights: `AmbientLight`, `DirectionalLight` and `PointLight`.
- `ForwardBlinnPhongMaterial`, `SpriteMaterial`, and the `ICameraMaterial`/`ILightsMaterial` interfaces.
- Mesh transforms (`position`, `rotation`, `scale`) and sub meshes (`addSubMesh`, `meshFactory.createWithSubMeshes`).
- OBJ/MTL loading through `framework.objLoader`, `ObjParser`, and `content.loadMeshAsync`, `loadUnlitMeshAsync` and `loadBlinnPhongMeshAsync`.
- `geometryBuilder.create(descriptor)` and the exported `BaseGeometry`.
- sRGB compressed texture formats (BC1, BC3, BC7, ETC2), with KTX2 loading choosing sRGB automatically.
- Examples: `unlit_mesh`, `blinn_phong_mesh` and `sprite_batch`.

### Changed

- `content.loadShaderModule` accepts optional replacement values.

### Fixed

- Sprites rendered white because of a stray value in the sprite shader.
- The orthographic camera's default eye was on the wrong side (z = -1).
- A second `Framework` instance reused the default texture and anisotropic-filtering extension from the first.
- A leftover `debugger` statement in WebGL device initialization.
- Swapped BC/S3TC compression flags could select BC7 on GPUs without BPTC support.

## [0.1.0]

- Initial release setup. `development` publishes a prerelease on the npm `next` tag. `main` publishes this version on `latest`.
- The package entry is compiled JavaScript and declarations in `dist`. Consumers import `Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and the types formerly published as `ris-framework-api` from `ris-framework` without compiling this repository. Built-in shaders and the browser KTX2 loader are included in that JavaScript.
- `ris-framework-api` is merged into this package under `src/api`. `ris-ktx2` is the only KTX dependency and also provides the KTX2 types; `ris-ktx2-api` is no longer used.
- `FrameworkConfiguration` adds `alpha` and `powerPreference`. `PowerPreferenceType` is exported from the package entry.
- The package license is Apache License 2.0. Copyright 2026 Luka Erkapic.
