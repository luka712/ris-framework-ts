import {TextureFormat} from "./TextureFormat.ts";
import type { IDisposable } from "../../core/IDisposable.ts";
import {TextureViewDimension} from "./TextureViewDimension.ts";

/**
 * The interface for texture views.
 */
export interface ITextureView extends IDisposable {

/**
 * The texture format of the texture view.
 */
  readonly textureFormat: TextureFormat;

/**
 * The dimension of the texture view.
 */
  readonly dimension: TextureViewDimension;

}
