import type {BlendStateDescriptor} from "../../core/rendering/blending/blend-state-descriptor.ts";
import type {IBlendState} from "../../api/index.ts";
import type {GpuBlendComponent} from "../WebGpuTypes.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";

/**
 * The WebGPU blend state. WebGPU bakes blending into the render pipeline, so this only holds the converted values.
 * @internal
 */
export class WebGpuBlendState implements IBlendState {

    /**
     * The constructor.
     * @param descriptor The blend state descriptor.
     */
    public constructor(descriptor: BlendStateDescriptor) {
        this.blendingEnabled = descriptor.blendingEnabled;
        this.color = {
            srcFactor: WebGpuConverter.convertBlendFactor(descriptor.color.srcFactor),
            dstFactor: WebGpuConverter.convertBlendFactor(descriptor.color.dstFactor),
            operation: WebGpuConverter.convertBlendOperation(descriptor.color.operation),
        };
        this.alpha = {
            srcFactor: WebGpuConverter.convertBlendFactor(descriptor.alpha.srcFactor),
            dstFactor: WebGpuConverter.convertBlendFactor(descriptor.alpha.dstFactor),
            operation: WebGpuConverter.convertBlendOperation(descriptor.alpha.operation),
        };
    }

    /** Whether blending is enabled. */
    public readonly blendingEnabled: boolean;

    /** The color blend component. */
    public readonly color: GpuBlendComponent;

    /** The alpha blend component. */
    public readonly alpha: GpuBlendComponent;

    /** The `GPUBlendState` for a color target, or undefined when blending is disabled. */
    public get gpuBlendState(): { color: GpuBlendComponent; alpha: GpuBlendComponent } | undefined {
        return this.blendingEnabled ? {color: this.color, alpha: this.alpha} : undefined;
    }

    /** @inheritDoc */
    public get nativePtr(): any {
        return this.gpuBlendState;
    }

    /** @inheritDoc */
    public dispose(): void {
        // Nothing to release.
    }
}
