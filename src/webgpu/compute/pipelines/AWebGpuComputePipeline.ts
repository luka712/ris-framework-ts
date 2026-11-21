import type { vec3 } from "gl-matrix";
import type { IFramework } from "../../../api/IFramework.ts";
import type { IComputePipeline } from "../../../api/gpu/compute/pipelines/IComputePipeline.ts";
import type { WebGpuGraphicsDevice } from "../../WebGpuGraphicsDevice.ts";
import { WebGpuUtilities } from "../../utilities/WebGpuUtilities.ts";
import { State } from "../../../api/_export.ts";

/**
 * The base WebGPU compute pipeline. Holds the device and builds the `GPUComputePipeline`.
 * @internal
 */
export abstract class AWebGpuComputePipeline implements IComputePipeline {

    protected readonly _framework: IFramework;
    protected _state = State.CREATED;
    protected readonly _graphicsDevice: WebGpuGraphicsDevice;
    protected _gpuPipeline: GPUComputePipeline | null = null;
    protected _pipelineLayout: GPUPipelineLayout | null = null;

    /**
     * The constructor.
     * @param framework The framework.
     */
    protected constructor(framework: IFramework) {
        this._framework = framework;
        this._graphicsDevice = framework.graphicsDevice as WebGpuGraphicsDevice;
    }
  
    /** @inheritdoc */
    public get state(): State {
        return this._state;
    }

    /** @inheritDoc */
    public abstract initialize(): void;

    /** @inheritdoc */
    public abstract initializeAsync(): Promise<void>;

    /** @inheritDoc */
    public abstract dispatch(workgroups: vec3): void;

    /** @inheritDoc */
    public abstract dispatchWorkgroup(x: number, y: number, z?: number): void;

    /** @inheritDoc */
    public abstract frameEnd(): void;

    /**
     * Creates the pipeline layout and the compute pipeline.
     * @param label The label.
     * @param module The WGSL module with a `main` entry point.
     * @param bindGroupLayouts The bind group layouts, in group order.
     */
    protected _createGpuPipeline(label: string, module: GPUShaderModule, bindGroupLayouts: GPUBindGroupLayout[]): void {
        const device = this._graphicsDevice.device;
        this._pipelineLayout = WebGpuUtilities.pipelineLayout.create(device, bindGroupLayouts, `${label} layout`);
        this._gpuPipeline = device.createComputePipeline({
            label,
            layout: this._pipelineLayout,
            compute: { module, entryPoint: "main" },
        });
        this._state = State.INITIALIZED;
    }

    /**
   * Creates the pipeline layout and the compute pipeline.
   * @param label The label.
   * @param module The WGSL module with a `main` entry point.
   * @param bindGroupLayouts The bind group layouts, in group order.
   */
    protected async _createGpuPipelineAsync(label: string, module: GPUShaderModule, bindGroupLayouts: GPUBindGroupLayout[])
        : Promise<void> {
        const device = this._graphicsDevice.device;
        this._pipelineLayout = WebGpuUtilities.pipelineLayout.create(device, bindGroupLayouts, `${label} layout`);
        this._gpuPipeline = await device.createComputePipelineAsync({
            label,
            layout: this._pipelineLayout,
            compute: { module, entryPoint: "main" },
        });
        if (this._state == State.DISPOSED) {
            this._gpuPipeline = null;
            this._pipelineLayout = null;
            return;
        }
        this._state = State.INITIALIZED;
    }

    /** @inheritDoc */
    public dispose(): void {

        if (this._state == State.DISPOSED) {
            return;
        }

        this._gpuPipeline = null;
        this._pipelineLayout = null;
        this._state = State.DISPOSED;
    }
}
