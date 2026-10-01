import { type RenderConfiguration } from "../core/renderer/renderer-interface";
import { ARenderer } from "../core/rendering/ARenderer.ts";
import { WebGlGraphicsDevice } from "./WebGlGraphicsDevice.ts";
import type {IFramework, IGraphicsDevice} from "ris-framework-api";

/**
 * The WebGL implementation of the IRenderer interface.
 */
export class WebGlRenderer extends ARenderer {

  private _renderConfiguration: RenderConfiguration;

  /**
   * The constructor.
   * @param framework The framework.
   * @param renderConfiguration The render configuration. This is used to initialize the renderer.
   */
  constructor(
     framework: IFramework,
     renderConfiguration: RenderConfiguration) {
    super(framework);
    this._renderConfiguration = renderConfiguration;
  }

  /** @inheritdoc */
  protected createGraphicsDevice(): IGraphicsDevice {
    return new WebGlGraphicsDevice(this._framework.windowManager, {
      samplerFilteringPreset: this._renderConfiguration.textureFiltering
    });
  }
}
