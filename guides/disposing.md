# Disposing

GPU resources (textures, samplers, buffers, pipelines) hold native memory, so you have to release them yourself. A texture gives you two ways to do that:

| Method | When the native texture is released | Use it when |
|--------|-------------------------------------|-------------|
| `dispose()` | Right away. | Nothing will draw with the texture again, e.g. on shutdown, or before the first frame uses it. |
| `queueDispose()` | At the end of the current frame, after it is submitted (`graphicsDevice.frameEnd()`). | The texture may already be used by commands recorded in the current frame. |

Both come from `IDeferredDisposable` (`src/api/core/IDeferredDisposable.ts`), which extends `IDisposable`.

## Why the end of the frame?

On WebGPU, draw calls are recorded into a command encoder and only run when the frame is submitted in `graphicsDevice.frameEnd()`. If a texture is destroyed after it was recorded but before submit, WebGPU fails the submit with *"Destroyed texture used in a submit"*. `frameEnd()` submits the frame first and then disposes the queued items, so the texture is only destroyed after the frame that used it was submitted.

WebGL has no deferred submit, but `queueDispose()` behaves the same way there, so code works the same on both backends.

## Lifecycle

```
INITIALIZED --queueDispose()--> DISPOSING --frameEnd(), after submit--> DISPOSED
INITIALIZED --dispose()--------------------------------------------->  DISPOSED
```

While a texture is `DISPOSING` it is still valid and can be drawn for the rest of the frame. Don't start using it for new work. Calling `dispose()` on a texture that is already `DISPOSED` does nothing.

## Example: dispose immediately

The texture is no longer drawn by anything, for example when the example shuts down:

```ts
const texture = await framework.content.loadTexture2DAsync(url);

// ... later, nothing renders with it anymore.
texture.dispose(); // views and the native texture are released now
```

## Example: dispose at the end of the frame

Replacing a texture from inside the frame, while the old one may already be recorded in a draw:

```ts
framework.addOnRenderListener(() => {
    spriteBatch.begin();
    spriteBatch.draw(texture, rect, color);
    spriteBatch.end();

    if (swapRequested) {
        texture.queueDispose(); // still valid until this frame is submitted
        texture = nextTexture;  // used from the next frame on
        swapRequested = false;
    }
});
```

Calling `texture.dispose()` here instead would destroy a texture that the current frame still refers to.

## Implementing it in a backend

`ATexture2D` and `ATexture2DArray` implement both methods. A backend only implements `_dispose()`, which releases its native object:

- `queueDispose()` sets `DISPOSING` and calls `graphicsDevice.queueDisposable(this)`.
- `dispose()` disposes the texture views, calls `_dispose()`, sets `DISPOSED` and raises the disposed listeners.

```ts
protected _dispose(): void {
    WebGpuUtilities.texture.dispose(this._gpuTexture);
    this._gpuTexture = null;
}
```
