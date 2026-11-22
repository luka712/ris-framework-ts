import {
    GeometryFormat,
    type IFramework,
    type ISampler,
    type ISpriteRenderPipeline,
    type ITexture2D,
    type IUniformBuffer,
} from "../../../api/index.ts";
import {VertexBufferLayout} from "../../../core/rendering/vertex-buffer-layout.ts";
import {AWebGpuMeshRenderPipeline, type IWebGpuUniformGroup} from "../material/AWebGpuMeshRenderPipeline.ts";

/**
 * The WebGPU sprite pipeline (`sprite.wgsl`), mirroring the WebGL sprite pipeline.
 * Group 0: projection-view (0). Group 1: texture (0), sampler (1).
 * @internal
 */
export class WebGpuSpriteRenderPipeline extends AWebGpuMeshRenderPipeline implements ISpriteRenderPipeline {

    private _projectionViewBuffer: IUniformBuffer;

    /**
     * The constructor.
     * @param framework The framework.
     * @param projectionViewBuffer The projection-view buffer.
     */
    public constructor(framework: IFramework, projectionViewBuffer: IUniformBuffer) {
        super(framework);
        this._projectionViewBuffer = projectionViewBuffer;
        this.vertexBufferLayouts = [VertexBufferLayout.createFloat3Float4Float2Layout()];
    }

    /** @inheritDoc */
    public readonly geometryFormat = GeometryFormat.POS3_COLOR4_TEXTURECOORDS2;

    /** @inheritDoc */
    protected readonly _shaderId = "sprite";

    /** @inheritDoc */
    protected _describeUniformGroups(): IWebGpuUniformGroup[] {
        return [
            {
                group: 0, bindings: [
                    {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: () => this._projectionViewBuffer},
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
    public get spriteTexture(): ITexture2D {
        return this.diffuseTexture;
    }

    /** @inheritDoc */
    public set spriteTexture(value: ITexture2D) {
        this.diffuseTexture = value;
    }

    /** @inheritDoc */
    public get textureSampler(): ISampler | undefined {
        return this.diffuseTextureSampler;
    }

    /** @inheritDoc */
    public set textureSampler(value: ISampler | undefined) {
        this.diffuseTextureSampler = value;
    }
}
