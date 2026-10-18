# Blinn-Phong mesh

The same cube as `unlit_mesh` (`assets/cube.obj` and `cube.mtl`, copied), drawn with `ForwardBlinnPhongMaterial`, an ambient light, one directional light and two coloured point lights orbiting the cube by delta time. A perspective camera looks at it, and it rotates by delta time.

- Lights are plain, framework-independent classes with a descriptor and defaults; ids are assigned automatically:
  - `new AmbientLight({ color, intensity })`: black, intensity 1.
  - `new DirectionalLight({ color, intensity, direction })`: white, intensity 1, direction (0, −1, 0).
  - `new PointLight({ color, intensity, position, constant, linear, quadratic })`: white, intensity 1, at the origin, attenuation 1 / 0.09 / 0.032.
- `intensity` is separate from `color` on every light; the buffer writes `color * intensity`.
- `new Scene(framework)` holds the meshes and the lights. It owns the lights buffer for the shader's `LightsBuffer` block (3 directional and 5 point slots) and an active ambient light (`scene.activeAmbientLight`, replaceable through its setter). Lights add themselves when given the scene (`new PointLight({...}, scene)`); `scene.add(item)` / `scene.remove(item)` work for meshes, lights and cameras alike. Adding more lights than the slots for that kind throws. `scene.directionalLights` and `scene.pointLights` are read-only lists.
- Each frame the ambient intensity pulses, the point lights get a new `position`, and `scene.update(time)` uploads the lights only when something changed. The render listener only calls `scene.render()`, which draws every mesh in the scene and its submeshes.
- `framework.content.loadBlinnPhongMeshAsync(url, scene)` loads the OBJ and its `mtllib` and returns a mesh that has already added itself to the scene, with one submesh per `usemtl` range. Ranges with the same material name share one `ForwardBlinnPhongMaterial`. `Kd` becomes diffuse, `Ka` ambient (falling back to `Kd`), `Ks` specular and `Ns` shininess; without `Ks`/`Ns` the defaults are 0.5 and 32. This example's copy of `cube.mtl` adds `Ks 0.6` and `Ns 48`. Every material uses the scene's lights.

The shader computes `texel * (ambientColor * ambientLight + Σ diffuseColor * light * max(N·L, 0)) + Σ specularColor * light * max(N·H, 0)^shininess`, where `H = normalize(L + V)`. Normals and positions are in world space, and V comes from the camera position buffer. It has `DIRECTIONAL_LIGHTS_COUNT` directional slots.

Point lights use the same diffuse and specular terms with `L = normalize(lightPosition - worldPosition)`, scaled by `1 / (constant + linear·d + quadratic·d²)`. The shader has `POINT_LIGHTS_COUNT` point slots.

Both counts are compile-time constants (3 by default) taken from the lights buffer: the material passes `maxDirectionalLights` and `maxPointLights` to the pipeline, and assigning a lights buffer with other counts switches the pipeline to that shader variant. The shader module cache key includes the replacement values, so each combination of counts is compiled once and reused.

Run `npm run dev:examples` and open `/blinn_phong_mesh/`.
