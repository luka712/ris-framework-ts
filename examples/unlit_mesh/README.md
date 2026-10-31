# Unlit mesh

Loads a cube from `assets/cube.obj` into a `Scene` with `framework.content.loadUnlitMeshAsync(url, camera)` and `scene.add(cube)` (the camera was created with `createPerspectiveCamera({...}, scene)`, which makes it `scene.camera`) and draws it with `scene.render()` through a perspective camera. The cube rotates at a fixed speed in radians per second, scaled by the frame's delta time.

`assets/cube.obj` is a hand-written unit cube: 8 positions, 4 texture coordinates, 6 normals and 12 triangles. It references `assets/cube.mtl` with `mtllib`, and each face picks one of six materials with `usemtl`.

How `loadUnlitMeshAsync` builds the mesh:

1. `ObjParser`, in the framework-independent `src/api/loaders/obj/`, parses the OBJ and MTL into plain data: an `ObjGeometryDefinition` with `materialRanges`, plus `ObjMaterialDefinition`s.
2. The geometry is mapped onto a framework `GeometryDescriptor` internally, and `geometryBuilder.create` turns that into geometry.
3. `framework.objLoader` creates one root `RenderableMesh` with a single vertex buffer and a single index buffer and no material. It has one sub mesh per `usemtl` range, here 6 faces and so 6 submeshes, and each submesh draws its own index range.
4. Each OBJ material gets an unlit material with `Kd` as its diffuse colour and `d` as alpha. Ranges that use the same material share one. For lit materials use `loadBlinnPhongMeshAsync` (see `blinn_phong_mesh`).

The transform lives on the root mesh, which owns one model buffer shared by every sub mesh's material, so `main.ts` only sets `cube.rotation`. `scene.add(cube)` wraps it in a `SceneMesh` (its sub meshes are not added separately), and `scene.render()` draws each sub mesh with its material.

Run `npm run dev:examples` and open `/unlit_mesh/`.
