import { type IRendererConfiguration } from "../api/rendering/renderer-interface.ts";
import { ARenderer } from "../core/rendering/ARenderer.ts";
import { WebGlGraphicsDevice } from "./WebGlGraphicsDevice.ts";
import type {IFramework, IGraphicsDevice} from "../api/index.ts";

/**
 * The WebGL implementation of the IRenderer interface.
 */
export class WebGlRenderer extends ARenderer {

  private _renderConfiguration: IRendererConfiguration;

  /**
   * The constructor.
   * @param framework The framework.
   * @param renderConfiguration The render configuration. This is used to initialize the renderer.
   */
  constructor(
     framework: IFramework,
     renderConfiguration: IRendererConfiguration) {
    super(framework);
    this._renderConfiguration = renderConfiguration;
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
