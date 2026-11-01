import {
    GeometryFormat,
    type IFramework,
    type IPrimitiveState,
    type IUniformBuffer,
    type IUnlitRenderPipeline,
} from "../../../api/index.ts";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout.ts";
import {AWebGpuMeshRenderPipeline, type IWebGpuUniformGroup} from "./AWebGpuMeshRenderPipeline.ts";
import {GpuShaderStage} from "../../WebGpuTypes.ts";

/**
 * The WebGPU unlit pipeline (`unlit_material.wgsl`).
 * Group 0: projection-view (0), model (1). Group 1: texture (0), sampler (1). Group 2: material (2).
 * @internal
 */
export class WebGpuUnlitRenderPipeline extends AWebGpuMeshRenderPipeline implements IUnlitRenderPipeline {

    private _projectionViewBuffer: IUniformBuffer;
    private _modelBuffer: IUniformBuffer;
    private _materialBuffer: IUniformBuffer;

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection-view buffer.
     * @param modelBuffer The model buffer.
     * @param materialBuffer The material buffer.
     * @param primitiveState The optional primitive state.
     */
    public constructor(framework: IFramework,
                       projectionViewBuffer: IUniformBuffer,
                       modelBuffer: IUniformBuffer,
                       materialBuffer: IUniformBuffer,
                       primitiveState?: IPrimitiveState) {
        if (!modelBuffer) {
            throw new Error("WebGpuUnlitRenderPipeline: modelBuffer is required (the mesh's model buffer, mat4).");
        }
        super(framework, primitiveState);
        this._projectionViewBuffer = projectionViewBuffer;
        this._modelBuffer = modelBuffer;
        this._materialBuffer = materialBuffer;
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float4Float2Layout()];
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2;

    /** @inheritDoc */
    protected readonly _shaderId = "unlit_material";

    /** @inheritDoc */
    protected _describeUniformGroups(): IWebGpuUniformGroup[] {
        return [
            {
                group: 0, bindings: [
                    {binding: 0, visibility: GpuShaderStage.VERTEX, buffer: () => this._projectionViewBuffer},
                    {binding: 1, visibility: GpuShaderStage.VERTEX, buffer: () => this._modelBuffer},
                ],
            },
            {
                group: 2, bindings: [
                    {binding: 2, visibility: GpuShaderStage.FRAGMENT, buffer: () => this._materialBuffer},
                ],
            },
        ];
    }

    /** @inheritDoc */
    public get projectionViewBuffer(): IUniformBuffer {
        return this._projectionViewBuffer;
    }

    /** @inheritDoc */
    public set projectionViewBuffer(value: IUniformBuffer) {
        this._projectionViewBuffer = value;
    }

    /** @inheritDoc */
    public get modelBuffer(): IUniformBuffer {
        return this._modelBuffer;
    }

    /** @inheritDoc */
    public set modelBuffer(value: IUniformBuffer) {
        if (!value) {
            throw new Error("WebGpuUnlitRenderPipeline: modelBuffer is required (the mesh's model buffer, mat4).");
        }
        this._modelBuffer = value;
    }

    /** @inheritDoc */
    public get materialBuffer(): IUniformBuffer {
        return this._materialBuffer;
    }

    /** @inheritDoc */
    public set materialBuffer(value: IUniformBuffer) {
        this._materialBuffer = value;
    }
}
