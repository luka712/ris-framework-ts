import {PowerPreferenceType} from "./rendering/PowerPreference.ts";
import type {vec2} from "gl-matrix";
import type {TextureSamplerFilteringPreset} from "../core/rendering/enums.ts";

/**
 * The configuration for the framework.
 * @public
 **/
export class IFrameworkConfiguration {
    /** If true, creates and makes the KTX2 factory available. */
    useKtx2?: boolean;

    /** The size of back buffer. */
    backBufferSize?: vec2;

    /** The texture filtering to configure */
    textureFiltering?: TextureSamplerFilteringPreset;

    /**
     * The HTMLCanvasElement to use for rendering.
     * If null, a new canvas will be created and added to the document body.
     */
    canvas?: HTMLCanvasElement;

    /** Should back buffer use alpha. */
    alpha?: boolean;

    /** The preference when it comes to selecting GPU device. Only makes sense to set on multi-GPU devices. */
    powerPreference ?: PowerPreferenceType;
}