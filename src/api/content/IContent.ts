import type { IDisposable } from "../core/IDisposable.ts";

/**
 * The content interface.
 * Every piece of content (textures, shader modules, meshes) implements this interface, so it can be disposed.
 */
export interface IContent extends IDisposable {

}
