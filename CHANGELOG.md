# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - Unreleased

Compared with `main` (0.1.0).

### Breaking changes

- **tsyringe and reflect-metadata removed.** Services are created by `Framework` and get their dependencies through constructors. Consumers no longer need `reflect-metadata` or decorator settings.
- **Perspective camera.** `cameraFactory.createPerspectiveCamera(descriptor?, scene?)` takes a `PerspectiveCameraDescriptor` (`fov` in degrees, `aspectRatio`, `near`, `far`, `eye`, `target`, `up`) instead of `(fov, aspectRatio, near, far)`. The `PerspectiveCamera` constructor is `(framework, descriptor?, scene?)` instead of `(framework, fov, aspectRatio, nearPlane, farPlane)`.
- **`ICamera.positionBuffer`.** This new member is required (std140 world-space eye). Custom `ICamera` implementations must provide it. `PerspectiveCamera`, `OrthographicCamera` and `OrbitCamera` implement it.
- **Meshes.** `meshFactory.create(scene, geometry, material)` replaces `create(geometry, geometryFormat)`. The `Mesh` constructor is `(framework, scene, material?)` instead of `(framework)`. The `QuadMesh` constructor is `(framework, scene, material, isUpdatable, scale?)`.
- **Materials.** `IMaterial.modelMatrix` is replaced by `IMaterial.modelBuffer`. The mesh owns the model buffer and assigns it before drawing. `UnlitMaterial` and `InspectTextureMipsMaterial` no longer create their own model buffer. They create their render pipeline once a model buffer is assigned, and rendering without one throws.
- **Render pipelines.** `createUnlitRenderPipeline` and `createInspectTextureMipsRenderPipeline` throw when no model buffer is passed.

### Added

- `Scene` holds meshes, lights and the active camera. `scene.add(item)` and `scene.remove(item)` accept a mesh, `AmbientLight`, `DirectionalLight`, `PointLight` or camera. Adding the same item twice does nothing. Meshes, lights and the perspective camera given a scene in their constructor add themselves, and a disposed mesh removes itself. Removing the active camera clears `scene.camera`. `scene.update(time)` assigns the camera to materials and uploads changed lights. `scene.render()` draws every mesh.
- Lights: `AmbientLight`, `DirectionalLight` and `PointLight` (constant, linear and quadratic attenuation) are plain data classes with descriptors, `intensity`, auto-assigned ids and an optional `scene` constructor argument. `LightsBuffer` is a std140 lights buffer with configurable directional and point light slots, and it uploads only when light data changed. `framework.lightsFactory` creates them.
- `ForwardBlinnPhongMaterial` with ambient, diffuse and Blinn-Phong specular lighting from directional and point lights. Normals use the normal matrix, so non-uniform scale is handled. Specular colour and shininess come from MTL `Ks` and `Ns`, and shader variants are cached per light count. Its descriptor requires `projectionViewBuffer` and `cameraPositionBuffer`, and `materialFactory.createForwardBlinnPhongMaterial(descriptor)` creates it.
- Mesh transforms: `mesh.position`, `mesh.rotation` (Euler radians, applied Y, then X, then Z), `mesh.scale` and a lazily computed `mesh.modelMatrix` / `mesh.modelBuffer`. Submeshes use their parent's transform.
- Submeshes: one mesh can draw several index ranges, each with its own material (`mesh.addSubMesh`, `meshFactory.createWithSubMeshes`).
- OBJ/MTL loading:
  - `ObjLoader` is framework-independent and produces plain definitions. `ObjLoader.loadAsync(path, options)` supports `resolveMaterialUrl` and `ignoreMaterials`.
  - `ObjGeometryMapper` maps the definitions to framework geometry.
  - `content.loadMeshAsync(path, scene)` loads a mesh with unlit materials, and `content.loadBlinnPhongMeshAsync(path, scene)` loads one with Blinn-Phong materials.
- `geometryBuilder.create(descriptor)` with `GeometryDescriptor`. `BaseGeometry` is exported.
- `SpriteMaterial` and `materialFactory.createSpriteMaterial`; sprite batches draw through it.
- `UnlitMaterialDescriptor.camera` and a `camera` property on the unlit and Blinn-Phong materials. A scene assigns its camera through this property.
- Examples: `unlit_mesh`, `blinn_phong_mesh` and `sprite_batch`, with `npm run dev:examples` and `npm run build:examples`.

### Changed

- `content.loadShaderModule(id, replacements?)` takes optional `##KEY##` replacement values, and they are part of the shader cache key.

### Fixed

- The sprite fragment shader added `vec4(1.0)` to every pixel, so sprites rendered white.
- The orthographic camera's default eye was at z = -1 instead of z = 1.
- `Framework.dispose()` did nothing, and `WindowManager.dispose()` threw "Method not implemented". `Framework.dispose()` now stops the event loop and removes the input listeners. It also deletes cached shader programs, the default texture and the graphics device resources.
- The default texture was a static shared by every `Framework` instance, so a second framework (a new GL context) reused a texture from the old one. It is now per framework.
- The anisotropic filtering helper cached the extension object from the first GL context on a shared static. It is now looked up per context.
- A leftover `debugger` statement in `WebGlGraphicsDevice` initialization is removed.

### Removed

- The `tsyringe` and `reflect-metadata` dependencies.
- `IMaterial.modelMatrix`, replaced by `modelBuffer` (see Breaking changes).

## [0.1.0]

- Initial release setup. `development` publishes a prerelease on the npm `next` tag. `main` publishes this version on `latest`.
- The package entry is compiled JavaScript and declarations in `dist`. Consumers import `Framework`, `FrameworkConfiguration`, `TextureSamplerFilteringPreset`, and the types formerly published as `ris-framework-api` from `ris-framework` without compiling this repository. Built-in shaders and the browser KTX2 loader are included in that JavaScript.
- `ris-framework-api` is merged into this package under `src/api`. `ris-ktx2` is the only KTX dependency and also provides the KTX2 types; `ris-ktx2-api` is no longer used.
- `FrameworkConfiguration` adds `alpha` and `powerPreference`. `PowerPreferenceType` is exported from the package entry.
- The package license is Apache License 2.0. Copyright 2026 Luka Erkapic.
