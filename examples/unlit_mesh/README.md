# Unlit mesh

Loads a cube from `assets/cube.obj` with `framework.content.loadMesh(url, camera, options)` and draws it through a perspective camera. The cube rotates at a fixed speed in radians per second, scaled by the frame's delta time.

`assets/cube.obj` is a hand-written unit cube: 8 positions, 4 texture coordinates, 6 normals and 12 triangles. It references `assets/cube.mtl` with `mtllib`, and each face picks one of six materials with `usemtl`.

How `loadMesh` builds the mesh:

1. `ObjLoader`, in the framework-independent `src/api/loaders/obj/`, parses the OBJ and MTL into plain data: an `ObjGeometryDefinition` with `materialRanges`, plus `ObjMaterialDefinition`s.
2. `ObjGeometryMapper.toDescriptor` maps the geometry onto a framework `GeometryDescriptor`, and `geometryBuilder.create` turns that into geometry.
3. `meshFactory.createWithSubMeshes` creates one mesh with a single vertex buffer and a single index buffer. It has one `SubMesh` per `usemtl` range, here 6 faces and so 6 submeshes, and each submesh draws its own index range.
4. Each OBJ material gets an unlit material with `Kd` as its diffuse colour and `d` as alpha. Ranges that use the same material share one. Pass `createMaterial` in the options to create other materials, such as a lit one later.

The model matrix lives on each material, so `main.ts` copies the rotation into every submesh's material and draws each submesh with `material.renderMesh(subMesh)`.

Vite can inline small assets as `data:` URLs, and a relative `mtllib` can't be resolved against those. So the example passes `resolveMaterialUrl` pointing at the bundled `cube.mtl`.

Run `npm run dev:examples` and open `/unlit_mesh/`.
