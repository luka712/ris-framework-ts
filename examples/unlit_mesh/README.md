# Unlit mesh

Loads a cube from `assets/cube.obj` with `ObjLoader`, builds a mesh with `meshFactory.create` and draws it with an unlit material through a perspective camera. The cube rotates at a fixed speed in radians per second, scaled by the frame's delta time.

`ObjLoader` returns the raw OBJ lists, with `indices` as `position/texcoord/normal` triplets. `main.ts` expands those into one vertex per face corner in the unlit material's `POS3_COLOR4_TEXTURECOORDS2` format. It gives each face its own colour so the cube is readable without lighting. Normals are kept on the geometry for a lit material later.

`assets/cube.obj` is a hand-written unit cube: 8 positions, 4 texture coordinates, 6 normals and 12 triangles.

Run `npm run dev:examples` and open `/unlit_mesh/`.
