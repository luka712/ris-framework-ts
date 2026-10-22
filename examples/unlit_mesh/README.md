# Unlit mesh

Loads a cube from `assets/cube.obj` into a `Scene` with `framework.content.loadMeshAsync(url, scene)` (the camera was created with `createPerspectiveCamera({...}, scene)`, which makes it `scene.camera`) and draws it with `scene.render()` through a perspective camera. The cube rotates at a fixed speed in radians per second, scaled by the frame's delta time.

`assets/cube.obj` is a hand-written unit cube: 8 positions, 4 texture coordinates, 6 normals and 12 triangles. It references `assets/cube.mtl` with `mtllib`, and each face picks one of six materials with `usemtl`.

How `loadMeshAsync` builds the mesh:

1. `ObjLoader`, in the framework-independent `src/api/loaders/obj/`, parses the OBJ and MTL into plain data: an `ObjGeometryDefinition` with `materialRanges`, plus `ObjMaterialDefinition`s.
2. The geometry is mapped onto a framework `GeometryDescriptor` internally, and `geometryBuilder.create` turns that into geometry.
3. `meshFactory.createWithSubMeshes` creates one mesh with a single vertex buffer and a single index buffer. It has one `SubMesh` per `usemtl` range, here 6 faces and so 6 submeshes, and each submesh draws its own index range.
4. Each OBJ material gets an unlit material with `Kd` as its diffuse colour and `d` as alpha. Ranges that use the same material share one. For lit materials use `loadBlinnPhongMeshAsync` (see `blinn_phong_mesh`).

The model matrix lives on each material, so `main.ts` copies the rotation into every submesh's material. The mesh added itself to the scene when it was created (its submeshes are not added separately), and `scene.render()` draws each submesh with its material.

Run `npm run dev:examples` and open `/unlit_mesh/`.
