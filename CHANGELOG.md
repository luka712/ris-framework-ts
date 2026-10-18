# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - Unreleased

### Breaking changes

- **tsyringe and reflect-metadata removed.** Services are created by `Framework` and get their dependencies through constructors. Consumers no longer need `reflect-metadata` or decorator settings.
- **Camera API.** `cameraFactory.createPerspectiveCamera(descriptor?, scene?)` takes a `PerspectiveCameraDescriptor` (`fov` in degrees, `aspectRatio`, `near`, `far`, `eye`, `target`, `up`) instead of positional arguments. The `PerspectiveCamera` constructor is now `(framework, descriptor?, scene?)`. `ICamera.positionBuffer` (std140 world-space eye) is required, and `OrthographicCamera` implements it.
- **Mesh factory.** `meshFactory.create(scene, geometry, material)` replaces `create(geometry, geometryFormat)`. Meshes belong to a `Scene`.
- **Materials.** `IMaterial.modelMatrix` is replaced by `IMaterial.modelBuffer`. The mesh owns the model buffer and assigns it before drawing. Materials create their render pipeline only once a model buffer is assigned, and rendering without one throws. Unlit, Blinn-Phong and inspect-mips WebGL pipelines throw when created without a model buffer.
- **Blinn-Phong material.** `ForwardBlinnPhongMaterialDescriptor` requires `projectionViewBuffer` and `cameraPositionBuffer`, for example a camera's `projectionViewBuffer` and `positionBuffer`. The constructor throws when either is missing. `createForwardBlinnPhongMaterial(descriptor)` requires the descriptor.
- **Scene registration.** `scene.camera` is `ICamera | undefined`. Internal `__addMesh`, `__removeMesh` and `__addAmbientLight` are gone; use `scene.add(item)` and `scene.remove(item)`.

### Added

- `Scene` holds meshes, lights and the active camera. `scene.add(item)` and `scene.remove(item)` accept a mesh, `AmbientLight`, `DirectionalLight`, `PointLight` or camera. Adding the same item twice does nothing. Meshes, lights and the perspective camera given a scene in their constructor add themselves, and a disposed mesh removes itself. Removing the active camera clears `scene.camera`. `scene.update(time)` assigns the camera to materials and uploads changed lights. `scene.render()` draws every mesh.
- Lights: `AmbientLight`, `DirectionalLight` and `PointLight` (constant, linear and quadratic attenuation) are plain data classes with descriptors, `intensity`, auto-assigned ids and an optional `scene` constructor argument. `LightsBuffer` is a std140 lights buffer with configurable directional and point light slots, and it uploads only when light data changed.
- `ForwardBlinnPhongMaterial` with ambient, diffuse and Blinn-Phong specular lighting from directional and point lights. Specular colour and shininess come from MTL `Ks` and `Ns`. Shader variants are cached per light count.
- Mesh transforms: `mesh.position`, `mesh.rotation` (Euler radians, applied Y, then X, then Z) and `mesh.scale`. The model matrix is computed lazily and in-place edits are detected. Submeshes use their parent's transform.
- Submeshes: one mesh can draw several index ranges, each with its own material (`mesh.addSubMesh`, `meshFactory.createWithSubMeshes`).
- OBJ/MTL loading: `ObjLoader` is framework-independent and produces plain definitions. `ObjGeometryMapper` maps them to framework geometry. `content.loadMeshAsync(path, scene)` loads a mesh with unlit materials and `content.loadBlinnPhongMeshAsync(path, scene)` loads one with Blinn-Phong materials. `ObjLoader.loadAsync(path, options)` supports `resolveMaterialUrl` and `ignoreMaterials`.
- `geometryBuilder.create(descriptor)` with `GeometryDescriptor`. `BaseGeometry` is exported.
- `SpriteMaterial` and `materialFactory.createSpriteMaterial`; sprite batches draw through it.
- `Framework.dispose()` stops the loop and disposes services, GL resources and per-framework caches (default texture, shader modules).
- Examples: `unlit_mesh`, `blinn_phong_mesh` and `sprite_batch`, with `npm run dev:examples` and `npm run build:examples`.

### Changed

- `content.loadShaderModule(id, replacements?)` substitutes `##KEY##` placeholders, and the replacement values are part of the shader cache key.
- Default textures and shader module caches are per framework instead of static.
- `shader-loader.ts` is renamed to `ShaderLoader.ts`.

### Fixed

- Blinn-Phong normals use the normal matrix, so lighting stays correct with non-uniform mesh scale.
- The ambient light colour and intensity are written to the lights buffer, and in-place edits are uploaded.
- Assigning a camera to a scene before `camera.initialize()` no longer binds missing buffers to materials. The scene binds it on the next `update()`.
- `ObjLoader` no longer guesses `.mtl` URLs relative to `data:` or `blob:` OBJ URLs. It warns and suggests `resolveMaterialUrl`.
- The sprite shader output is fixed, and the orthographic camera's default eye is corrected.

### Removed

- The `tsyringe` and `reflect-metadata` dependencies.

## [0.1.0]

- Initial release setup. `development` publishes a prerelease on the npm `next` tag. `main` publishes this version on `latest`.
- The package entry is compiled JavaScript and declarations in `dist`. Consumers import `Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and the types formerly published as `ris-framework-api` from `ris-framework` without compiling this repository. Built-in shaders and the browser KTX2 loader are included in that JavaScript.
- `ris-framework-api` is merged into this package under `src/api`. `ris-ktx2` is the only KTX dependency and also provides the KTX2 types; `ris-ktx2-api` is no longer used.
- `FrameworkConfiguration` adds `alpha` and `powerPreference`. `PowerPreferenceType` is exported from the package entry.
- The package license is Apache License 2.0. Copyright 2026 Luka Erkapic.
