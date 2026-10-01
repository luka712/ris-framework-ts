import type { BlendStateDescriptor } from "../../core/rendering/blending/blend-state-descriptor";
import { WebGlConverter } from "../utilities/WebGlConverter.ts";
import type { WebGlGraphicsDevice } from "../WebGlGraphicsDevice.ts";
import type {IBlendState} from "ris-framework-api";

/**
 * The WebGL blend state.
 */
export class WebGlBlendState implements IBlendState {

    private readonly _gl: WebGL2RenderingContext;

    private _blendEnabled: boolean;
    private _srcColorFactor: GLenum;
    private _dstColorFactor: GLenum;
    private _colorBlendOperation: GLenum;
    private _srcAlphaFactor: GLenum;
    private _dstAlphaFactor: GLenum;
    private _alphaBlendOperation: GLenum;

    /**
     * The constructor.
     * @param _graphicsDevice The graphics device.
     * @param descriptor The blend state descriptor.
     */
    public constructor(private readonly _graphicsDevice: WebGlGraphicsDevice, descriptor: BlendStateDescriptor) {
        this._gl = this._graphicsDevice.gl;
        this._blendEnabled = descriptor.blendingEnabled;
        this._srcColorFactor = WebGlConverter.convertBlendFactor(this._gl, descriptor.color.srcFactor);
        this._dstColorFactor = WebGlConverter.convertBlendFactor(this._gl, descriptor.color.dstFactor);
        this._colorBlendOperation = WebGlConverter.convertBlendOperation(this._gl, descriptor.color.operation);
        this._srcAlphaFactor = WebGlConverter.convertBlendFactor(this._gl, descriptor.alpha.srcFactor);
        this._dstAlphaFactor = WebGlConverter.convertBlendFactor(this._gl, descriptor.alpha.dstFactor);
        this._alphaBlendOperation = WebGlConverter.convertBlendOperation(this._gl, descriptor.alpha.operation);
    }

    /** @inheritdoc */
    public nativePtr: any;

    /**
     * For internal use only. Applies the blend state to the WebGL context.
     * @param gl The WebGL context to apply the blend state to.
     */
    public apply(gl: WebGL2RenderingContext): void {
        if (this._blendEnabled) {
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(this._srcColorFactor, this._dstColorFactor, this._srcAlphaFactor, this._dstAlphaFactor);
            gl.blendEquationSeparate(this._colorBlendOperation, this._alphaBlendOperation);
        } else {
            gl.disable(gl.BLEND);
        }
    }

    /** @inheritdoc */
    public dispose(): void {
        // No resources to dispose for blend state in WebGL, as the state is applied directly to the WebGL context.
    }

}