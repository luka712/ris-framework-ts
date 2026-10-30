# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - Unreleased

Compared with `main` (0.1.0).

### Breaking changes

- **tsyringe and reflect-metadata removed.** Services are created by `Framework` and get their dependencies through constructors. Consumers no longer need `reflect-metadata` or decorator settings.
- **Perspective camera.** `cameraFactory.createPerspectiveCamera(descriptor?, scene?)` takes a `PerspectiveCameraDescriptor` (`fov` in degrees, `aspectRatio`, `near`, `far`, `eye`, `target`, `up`) instead of `(fov, aspectRatio, near, far)`. The `PerspectiveCamera` constructor is `(framework, descriptor?, scene?)` instead of `(framework, fov, aspectRatio, nearPlane, farPlane)`.
- **`ICamera.positionBuffer`.** This new member is required (std140 world-space eye). Custom `ICamera` implementations must provide it. `PerspectiveCamera`, `OrthographicCamera` and `OrbitCamera` implement it.
- **Meshes.** Split like the C# framework: `IMesh`/`Mesh` hold only geometry and the vertex and index buffers, and `IRenderableMesh`/`RenderableMesh` add the material, index range, sub meshes and transform. `meshFactory.createMesh(geometry, geometryFormat)` replaces `create(geometry, geometryFormat)`; `meshFactory.create(geometry, material)` now returns an `IRenderableMesh`. The `QuadMesh` constructor is `(framework, material, isUpdatable, scale?)` and it extends `RenderableMesh`.
- **Materials.** `IMaterial.renderMesh` takes an `IRenderableMesh` instead of an `IMesh`. `IMaterial.modelMatrix` is replaced by `IMaterial.modelBuffer`. The mesh owns the model buffer and assigns it before drawing. `UnlitMaterial` and `InspectTextureMipsMaterial` no longer create their own model buffer. They create their render pipeline once a model buffer is assigned, and rendering without one throws.
- **Render pipelines.** `createUnlitRenderPipeline` and `createInspectTextureMipsRenderPipeline` throw when no model buffer is passed.

### Added

- `Scene` holds meshes, lights and the active camera. `scene.add(item)` and `scene.remove(item)` accept a renderable mesh, a `SceneMesh`, `AmbientLight`, `DirectionalLight`, `PointLight` or camera. Adding the same item twice does nothing. Lights and the perspective camera given a scene in their constructor add themselves; meshes are added with `scene.add(mesh)`. Removing the active camera clears `scene.camera`. The scene keeps up to 3 directional and 5 point lights, and `scene.update(time)` hands its camera, its active ambient light and its light lists (by reference) to the mesh materials. `scene.render()` draws every mesh.
- `SceneMesh`: `new SceneMesh(renderableMesh)` is how a scene holds a mesh. It covers the mesh and its sub meshes and owns their materials, so `sceneMesh.dispose()` (and `scene.dispose()`) disposes the mesh and each distinct material once.
- `IRenderableMesh`/`RenderableMesh`: a mesh plus an optional material, `indexStart`, `indexCount` (-1 draws all) and sub meshes. Sub meshes (`mesh.addSubMesh(material, start, count)` or `new RenderableMesh(framework, material, parent, start, count)`) share the parent's vertex and index buffers. A mesh with a material draws its range, then its sub meshes; a root without one draws only its sub meshes. Disposing the root frees the shared buffers once and never disposes materials.
- Material interfaces `ICameraMaterial` (`camera`) and `ILightsMaterial` (`ambientLight`, `directionalLights`, `pointLights`), with `isCameraMaterial` and `isLightsMaterial`.
- Lights: `AmbientLight`, `DirectionalLight` and `PointLight` (constant, linear and quadratic attenuation) are plain data classes with descriptors, `intensity`, auto-assigned ids and an optional `scene` constructor argument. `framework.lightsFactory` creates ambient lights.
- `ForwardBlinnPhongMaterial` with ambient, diffuse and Blinn-Phong specular lighting from directional and point lights. Normals use the normal matrix, so non-uniform scale is handled. Specular colour and shininess come from MTL `Ks` and `Ns`, and shader variants are cached per light count. Each material owns its lights buffer (3 directional and 5 point slots, 88 floats) and uploads it only when the light data changed. Its descriptor requires `projectionViewBuffer` and `cameraPositionBuffer`, and `materialFactory.createForwardBlinnPhongMaterial(descriptor)` creates it.
- Renderable mesh transforms: `mesh.position`, `mesh.rotation` (Euler radians, applied Y, then X, then Z), `mesh.scale` and a lazily computed `mesh.modelMatrix` / `mesh.modelBuffer`. The root owns one model buffer that all its sub meshes and their materials share.
- `meshFactory.createWithSubMeshes(geometry, subMeshes)` creates a root renderable mesh with one sub mesh per index range.
- OBJ/MTL loading:
  - `ObjParser` is framework-independent and produces plain definitions. `parser.loadAsync(path, options)` supports `resolveMaterialUrl` and `ignoreMaterials`, and `parser.parseAsync(path)` returns an `ObjModel` (geometry, `ObjSubMesh` per `usemtl` range with its `ObjMaterialDefinition`).
  - `ObjLoader`, available as `framework.objLoader`: `loadAsync(path, blinnPhongDescriptor)` returns a renderable mesh with one Blinn-Phong material per material name (`Kd`, `Ka` falling back to `Kd`, `Ks` default 0.5, `Ns` default 32), `loadAsync(path, subMesh => material)` lets the caller create the materials, and the static `ObjLoader.parseAsync(path)` parses without creating GPU resources. The root has no material and white vertex colours.
  - `content.loadMeshAsync(path, geometryFormat)` returns a plain `IMesh` (buffers only). `content.loadUnlitMeshAsync(path, camera?)` and `content.loadBlinnPhongMeshAsync(path, camera)` delegate to `framework.objLoader`; add the result with `scene.add(mesh)`.
- `geometryBuilder.create(descriptor)` with `GeometryDescriptor`. `BaseGeometry` is exported.
- `SpriteMaterial` and `materialFactory.createSpriteMaterial`; sprite batches draw through it.
- `UnlitMaterialDescriptor.camera` and a `camera` property on the unlit and Blinn-Phong materials. A scene assigns its camera through this property.
- Examples: `unlit_mesh`, `blinn_phong_mesh` and `sprite_batch`, with `npm run dev:examples` and `npm run build:examples`.

### Changed

- `content.loadShaderModule(id, replacements?)` takes optional `##KEY##` replacement values, and they are part of the shader cache key.

### Fixed

- The sprite fragment shader added `vec4(1.0)` to every pixel, so sprites rendered white.
- The orthographic camera's default eye was at z = -1 instead of z = 1.
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
