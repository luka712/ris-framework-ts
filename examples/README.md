# Examples

Each example lives in its own folder with an `index.html` and `main.ts`, and imports the framework from `src/index.ts`, the package entry. `examples/vite.config.ts` picks up every `examples/<name>/index.html` as a page, and `examples/index.html` links them. To add an example, create a folder with an `index.html` and add a link to the index page.

| Example | What it shows |
| --- | --- |
| [`sprite_batch`](sprite_batch/) | Texture loading and drawing a single sprite with the sprite batch. |
| [`unlit_mesh`](unlit_mesh/) | OBJ/MTL loading with content.loadMesh, submeshes with one unlit material each, and a rotating perspective camera view. |
| [`blinn_phong_mesh`](blinn_phong_mesh/) | ForwardBlinnPhongMaterial from the material factory, submeshes, and a lights buffer (ambient + directional) from `ambientLightFactory.createLightsBuffer`. |

```sh
npm run dev:examples      # serve all examples
npm run build:examples    # build them into examples/dist/
```
