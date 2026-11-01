import { ARenderer } from "../core/rendering/ARenderer.ts";
import { WebGlGraphicsDevice } from "./WebGlGraphicsDevice.ts";
import type {IFramework, IGraphicsDevice, IRendererConfiguration} from "../api/index.ts";

/**
 * The WebGL implementation of the IRenderer interface.
 */
export class WebGlRenderer extends ARenderer {


  /**
   * The constructor.
   * @param framework The framework.
   * @param renderConfiguration The render configuration. This is used to initialize the renderer.
   */
  constructor(
     framework: IFramework,
     renderConfiguration: IRendererConfiguration) {
    super(framework, renderConfiguration);
  }

  /** @inheritdoc */
  protected createGraphicsDevice(): IGraphicsDevice {
    return new WebGlGraphicsDevice(this._framework.windowManager, {
      samplerFilteringPreset: this._renderConfiguration.textureFiltering,
      alpha: this._renderConfiguration.alpha,
      powerPreference: this._renderConfiguration.powerPreference,
    });
  }
}
