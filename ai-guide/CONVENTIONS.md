# Code conventions

Rules for anyone (human or AI assistant) changing this repository. Follow them before adding code; they come from repeated review feedback.

## Structure

- **No static pass-through wrappers.** Call the utility directly (`WebGpuUtilities.instance.isSupported()`). Don't add a static method that only forwards to another call.
- **No silent fallbacks.** If a requested backend or feature is unavailable, throw a clear error. Don't switch to another backend or code path behind the caller's back (for example, WebGPU must not fall back to WebGL).
- **No dependency-injection container.** Wire services with plain constructors.
- **No resolve helpers for descriptors.** Descriptors are interfaces (`I...Descriptor`) with optional fields; fill defaults inline with `??` where each value is used.
- **Shared logic in abstract base classes**, backend classes (`WebGl...`, `WebGpu...`) only do backend-specific work.
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
- Error messages name the class and method, the offending value and what was expected, e.g. `WebGpuTextureUtilities.create2DArray: 'label' has 0 layers; the layer count must be greater than 0.`
- `CHANGELOG.md` is a short list of public-facing changes only.

## Examples

- Examples live in `examples/<name>/` and use the shared backend switcher.
- Load content through the framework (`framework.content...`) rather than calling loaders directly.
- Prefer creating a scene and drawing through it.

## Checks before handing off

`npx vitest run`, `npm run build:app`, `npm run build:examples`, `npx tsc --noEmit`, `git diff --check`.
