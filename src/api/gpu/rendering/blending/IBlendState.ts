import type { IDisposable } from "../../../core/IDisposable.ts";

/**
 * The blend state.
 *     It is created from a blend state descriptor and contains the
 *     actual blend state that can be applied to the graphics pipeline.
 */
export interface IBlendState extends IDisposable {

    /**
     * The native pointer to the blend state.
     * May be null if the API has no native representation; the blend state is still usable.
     */
    readonly nativePtr: any;
}
