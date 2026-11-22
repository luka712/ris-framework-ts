# Code conventions

Rules for anyone (human or AI assistant) changing this repository. Follow them before adding code; they come from repeated review feedback.

## Structure

- **Keep APIs simple and readable:** no fallbacks, minimal validation (only throws that are asked for), no methods that just call other simple methods, and nothing made public just for tests.
- **Don't patch just to make it work.** When an AI assistant finds a problem outside the task (a missing flag, a workaround, a design gap), it reports the problem and what could be done instead of changing the code.
- **Prefer an obvious error over a hack.** When something isn't supported or is set up wrong, let it throw with a clear message instead of adding a hotfix that hides it; errors are easier to track.
- **No static pass-through wrappers.** Call the utility directly (`WebGpuUtilities.instance.isSupported()`). Don't add a static method that only forwards to another call.
- **No silent fallbacks.** If a requested backend or feature is unavailable, throw a clear error. Don't switch to another backend or code path behind the caller's back (for example, WebGPU must not fall back to WebGL).
- **No dependency-injection container.** Wire services with plain constructors.
- **Framework owns the graphics device.** It creates the device for the configured backend, injects it into the renderer constructor, initializes it before the renderer, and disposes it. Use `framework.graphicsDevice` (and `graphicsDevice.api` / `graphicsDevice.limits`). There is no `renderer.backend` or `renderer.limits`.
- **No resolve helpers for descriptors.** Descriptors are interfaces (`I...Descriptor`) with optional fields; fill defaults inline with `??` where each value is used.
- **Shared logic in abstract base classes**, backend classes (`WebGl...`, `WebGpu...`) only do backend-specific work.
- **Wrappers create their native object.** Many framework classes are inspired by WebGPU counterparts and are facades over the backend, so the backend can be swapped. A wrapper takes framework inputs (`framework`, an owner object such as a texture, and our descriptor) and creates the native object itself; it does not receive a native object.
- **Choose by capability, not backend type**, e.g. check `supportsTextureView` on the device features instead of comparing the rendering backend.
- `src` is browser-only code.

## Data and GPU

- Uniform buffers take floats only. Booleans are `boolean` in the interface and written as `0`/`1` in the buffer.
- Buffer `offset` and `length` are counted in floats, not bytes.
- Never mutate the texture usage flags a caller passed in; use them as given.
- Textures expose `size` (`vec2`, or `vec3` with layers for arrays). There is no `nativeSize`; logical vs. physical sizes aren't supported.
- Mip level counts come from `TextureUtilities` (`maxMipLevels(data)`, `mipLevels(width, height)`), the same way on WebGL and WebGPU.
- Shader modules use `#include` (GLSL and WGSL), not `#import`.
- `TextureFormat` members follow the wgpu enum in upper snake case (`RGBA8_UNORM`, `BC7_RGBA_UNORM_SRGB`).

## Docs and errors

- Every public class, interface, method, property and enum has a doc comment. State defaults ("By default, 1.") and use `@param`, `@returns`, `@throws`.
- When an AI assistant adds a method or property, its doc comment is tagged `@ai-generated` so it can be reviewed.
- Public docs (JSDoc, README, CHANGELOG) state only what users need: what it is, parameters, defaults, and what throws. Don't add internal implementation details, ownership/injection notes, history, or comparisons with other ports.
- Error messages name the class and method, the offending value and what was expected, e.g. `WebGpuTextureUtilities.create2DArray: 'label' has 0 layers; the layer count must be greater than 0.`
- `CHANGELOG.md` is a short list of public-facing changes only.

## Examples

- Examples live in `examples/<name>/` and use the shared backend switcher.
- Load content through the framework (`framework.content...`) rather than calling loaders directly.
- Prefer creating a scene and drawing through it.

## Checks before handing off

`npx vitest run`, `npm run build:app`, `npm run build:examples`, `npx tsc --noEmit`, `git diff --check`.
