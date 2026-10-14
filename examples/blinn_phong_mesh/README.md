# Blinn-Phong mesh

The same cube as `unlit_mesh` (`assets/cube.obj` and `cube.mtl`, copied), drawn with `ForwardBlinnPhongMaterial`, an ambient light and one directional light. A perspective camera looks at it, and it rotates by delta time.

- Lights are plain data. `AmbientLight` is a class, and directional lights are `{ id, value, direction }` objects.
- `framework.ambientLightFactory.createLightsBuffer({ ambientLight, directionalLights })` creates the lights buffer. It owns the uniform buffer for the shader's `LightsBuffer` block and is assigned to every material as `material.lightsBuffer`. Each frame the ambient value pulses slightly, and `lights.update()` uploads only when something changed.
- The materials come from `framework.materialFactory.createForwardBlinnPhongMaterial({camera})`. Each OBJ material's `Kd` becomes the material's ambient colour, and a darker `Kd` its diffuse colour.
- `content.loadMesh` only creates unlit materials, so `main.ts` builds the mesh itself:
  - `ObjLoader.fromText` and `parseMtl` parse the OBJ and MTL.
  - `ObjGeometryMapper.toDescriptor` and `geometryBuilder.create` build the geometry.
  - `meshFactory.createWithSubMeshes` makes one submesh per `usemtl` range.
- The OBJ and MTL are imported with `?raw`, so the `.mtl` is found even when Vite inlines small assets.

The shader computes `texel * (ambientColor * ambientLight + sum of diffuseColor * light * max(N·L, 0))`. It has `DIRECTIONAL_LIGHTS_COUNT` slots, 3 by default, which must match `maxDirectionalLights` on the lights buffer.

Run `npm run dev:examples` and open `/blinn_phong_mesh/`.
