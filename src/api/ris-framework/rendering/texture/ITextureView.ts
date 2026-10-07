import {TextureFormat} from "./TextureFormat";
import {IDisposable} from "../../core/IDisposable";
import {TextureViewDimension} from "./TextureViewDimension";

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
