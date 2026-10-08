import { TextureSamplerFilteringPreset } from "../core/rendering/enums.ts";
import {vec2} from "gl-matrix";
import type {IFrameworkConfiguration} from "./IFrameworkConfiguration.ts";
import {PowerPreferenceType} from "./rendering/PowerPreference.ts";

/**
 * The options for configuring the Framework.
 * @public
 */
export class FrameworkConfiguration implements IFrameworkConfiguration {

    /** @inheritDoc */
    useKtx2 = false;

    /** @inheritDoc */
    canvas?: HTMLCanvasElement;

    /** @inheritDoc */
    backBufferSize?: vec2;

    /** @inheritDoc */
    textureFiltering? = TextureSamplerFilteringPreset.BILINEAR;

    /** @inheritDoc */
    alpha = false;

    /** @inheritDoc */
    powerPreference = PowerPreferenceType.DEFAULT;
}