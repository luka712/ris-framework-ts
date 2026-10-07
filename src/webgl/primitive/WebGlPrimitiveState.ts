import { type PrimitiveTopology, CullMode, type FrontFace } from "../../core/rendering/primitive/enums";
import type { PrimitiveStateDescriptor } from "../../core/rendering/primitive/PrimitiveStateDescriptor.ts";
import type { IPrimitiveState } from "../../api/index.ts";
import { WebGlConverter } from "../utilities/WebGlConverter.ts";

/**
* The WebGL implementation of a primitive state.
*/
export class WebGlPrimitiveState implements IPrimitiveState {
    private readonly _cullingEnabled: boolean;
    private readonly _glPrimitiveType: number;
    private readonly _glCullFace: number;
    private readonly _glFrontFace: number;

    /**
     * The constructor.
     * @param _gl The WebGL2 Rendering Context.
     * @param descriptor The descriptor of the primitive state.
     */
    public constructor(_gl: WebGL2RenderingContext, descriptor: PrimitiveStateDescriptor) {
        this.topology = descriptor.topology;
        this.cullFace = descriptor.cullFace;
        this.frontFace = descriptor.frontFace;

        this._cullingEnabled = this.cullFace != CullMode.NONE;

        this._glPrimitiveType = WebGlConverter.convertPrimitiveType(this.topology);
        this._glCullFace = WebGlConverter.convertCullFace(this.cullFace);
        this._glFrontFace = WebGlConverter.convertFrontFace(this.frontFace);
    }

    /** @inheritdoc */
    public readonly topology: PrimitiveTopology;

    /** @inheritdoc */
    public readonly cullFace: CullMode;

    /** @inheritdoc */
    public readonly frontFace: FrontFace;

    /**
    * The primitive type to draw.
    */
    public get glPrimitiveType() {
        return this._glPrimitiveType;
    }

    /** @inheritdoc */
    public apply(gl: WebGL2RenderingContext) {
        if (this._cullingEnabled) {
            gl.enable(gl.CULL_FACE);
            gl.cullFace(this._glCullFace);
        }
        else {
            gl.disable(gl.CULL_FACE);
        }

        gl.frontFace(this._glFrontFace);
    }
}