import {IDisposable} from "../../core/IDisposable";

/**
 * The blend state.
 *     It is created from a blend state descriptor and contains the
 *     actual blend state that can be applied to the graphics pipeline.
 */
export interface IBlendState extends IDisposable {

    /**
     * The native pointer to the blend state.
     * This is used internally by the graphics API to apply the blend state to the pipeline.
     * In some cases it can be null pointer, if API does not have a native representation
     * of the blend state, but it is still usable and can be applied to the pipeline.
     */
    readonly nativePtr: any;
}
