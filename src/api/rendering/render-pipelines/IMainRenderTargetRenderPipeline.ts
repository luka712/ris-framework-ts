import type { IRenderPipeline } from "./IRenderPipeline.ts";
import type { ITexture2D } from "../texture/ITexture2D.ts";

/**
 * Pipeline that is used in renderer as
 * a pass that renders from the main frame buffer to the screen.
 */
export interface IMainRenderTargetRenderPipeline extends IRenderPipeline {

    /**
     * The texture that is used as a main frame buffer.
     * The pipeline will render this texture to the screen.
     */
    readonly mainRenderTarget: ITexture2D;

    /**
     * Render to the screen.
     */
    render(): void;

}
