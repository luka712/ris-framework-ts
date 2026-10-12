# Examples

Each example lives in its own folder with an `index.html` and `main.ts`, and imports the framework from `src/index.ts`, the package entry. `examples/vite.config.ts` picks up every `examples/<name>/index.html` as a page, and `examples/index.html` links them. To add an example, create a folder with an `index.html` and add a link to the index page.

| Example | What it shows |
| --- | --- |
| [`sprite_batch`](sprite_batch/) | Texture loading and drawing a single sprite with the sprite batch. |
| [`unlit_mesh`](unlit_mesh/) | OBJ loading, a mesh with the unlit material, and a rotating perspective camera view. |

```sh
npm run dev:examples      # serve all examples
npm run build:examples    # build them into examples/dist/
```
