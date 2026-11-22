import {
    type IRenderPass,
    type IRenderPassDescriptor,
    LoadAction,
    type RenderPassColorAttachment,
    StoreAction,
} from "../../api/index.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuConverter } from "../utilities/WebGpuConverter.ts";
import { WebGpuTexture2D } from "../texture/WebGpuTexture2D.ts";
import type { WebGpuSwapChain } from "../swap-chain/WebGpuSwapChain.ts";
import type { WebGpuCommandEncoder } from "../WebGpuCommandEncoder.ts";

/**
 * The WebGPU render pass. Uses the descriptor's command encoder, or the device's main encoder.
 * {@link endPass} ends the GPU pass; {@link submit} submits a custom encoder only.
 * @internal
 */
export class WebGpuRenderPass implements IRenderPass {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _descriptor: IRenderPassDescriptor;
    private readonly _colorAttachments: RenderPassColorAttachment[];
    private _commandEncoder: WebGpuCommandEncoder;

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param descriptor The render pass descriptor.
     */
    public constructor(graphicsDevice: WebGpuGraphicsDevice, descriptor: IRenderPassDescriptor) {
        this._graphicsDevice = graphicsDevice;
        this._descriptor = descriptor;
        if (!descriptor.colorAttachments || descriptor.colorAttachments.length === 0) {
            throw new Error("WebGpuRenderPass: at least one color attachment is required.");
        }

        this._commandEncoder = (this._descriptor.commandEncoder ?? graphicsDevice.mainCommandEncoder) as WebGpuCommandEncoder;

        // Own copy, so setColorAttachment does not change the caller's descriptor.
        this._colorAttachments = descriptor.colorAttachments.slice();
        this.label = this._descriptor.label;
    }

    /** @inheritdoc */
    public readonly label?: string;

    /**
     * The underlying WebGPU render pass encoder.
     */
    public gpuRenderPassEncoder: GPURenderPassEncoder = null!;

    /**
     * Replaces the color attachment at the index. The GPU descriptor is built on every {@link beginPass},
     * so the new attachment (e.g. a texture view in another format) is used from the next pass on.
     * @inheritDoc
     */
    public setColorAttachment(index: number, value: RenderPassColorAttachment): void {
        if (index < 0 || index >= this._colorAttachments.length) {
            throw new Error(`WebGpuRenderPass: color attachment index ${index} is out of range [0, ${this._colorAttachments.length - 1}].`);
        }
        if (!value.swapChain && !value.view && !value.texture) {
            throw new Error("WebGpuRenderPass: a color attachment needs a swap chain, view or texture.");
        }
        this._colorAttachments[index] = value;
    }

    private _buildDescriptor(): GPURenderPassDescriptor {
        const colorAttachments: GPURenderPassColorAttachment[] = this._colorAttachments.map(attachment => {
            let view: GPUTextureView;
            if (attachment.swapChain) {
                view = (attachment.swapChain as WebGpuSwapChain).currentTextureView;
            } else if (attachment.view) {
                // A specific view, e.g. the sRGB view of the main render target.
                view = attachment.view.nativeObject as GPUTextureView;
            } else if (attachment.texture) {
                view = (attachment.texture as WebGpuTexture2D).gpuDefaultView;
            } else {
                throw new Error("WebGpuRenderPass: a color attachment needs a swap chain, view or texture.");
            }
            const c = attachment.clearColor;
            return {
                view,
                resolveTarget: attachment.resolveView
                    ? attachment.resolveView.nativeObject as GPUTextureView
                    : attachment.resolveTexture ? (attachment.resolveTexture as WebGpuTexture2D).gpuDefaultView : undefined,
                clearValue: { r: c.r, g: c.g, b: c.b, a: c.a },
                loadOp: WebGpuConverter.convertLoadAction(attachment.loadAction),
                storeOp: WebGpuConverter.convertStoreAction(attachment.storeAction),
            };
        });

        const result: GPURenderPassDescriptor = {
            label: this._descriptor.label,
            colorAttachments,
        };

        const depth = this._descriptor.depthStencilAttachment;
        if (depth && (depth.texture || depth.view)) {
            const texture = depth.texture as WebGpuTexture2D | undefined;
            const format = depth.view?.viewFormat ?? texture!.textureFormat;
            const attachment: GPURenderPassDepthStencilAttachment = {
                view: depth.view ? depth.view.nativeObject as GPUTextureView : texture!.gpuDefaultView,
                depthClearValue: depth.depthClearValue,
                depthLoadOp: WebGpuConverter.convertLoadAction(depth.depthLoadAction),
                depthStoreOp: WebGpuConverter.convertStoreAction(depth.depthStoreAction),
            };
            // Stencil ops are only valid when the format has a stencil aspect.
            if (WebGpuConverter.hasStencil(format)) {
                attachment.stencilClearValue = depth.stencilClearValue;
                attachment.stencilLoadOp = depth.stencilLoadAction === LoadAction.LOAD ? "load" : "clear";
                attachment.stencilStoreOp = depth.stencilStoreAction === StoreAction.DISCARD ? "discard" : "store";
            }
            result.depthStencilAttachment = attachment;
        }
        // A depth attachment without a texture would need an internal depth buffer (WebGL uses a renderbuffer).
        // TODO: create an internal depth texture for that case.

        return result;
    }

    /** Whether the pass has a depth attachment. */
    public get hasDepthStencil(): boolean {
        const depth = this._descriptor.depthStencilAttachment;
        return !!depth && !!(depth.texture || depth.view);
    }

    /** @inheritDoc */
    public beginPass(): void {
        const encoder = this._commandEncoder.gpuCommandEncoder!;
        this.gpuRenderPassEncoder = encoder.beginRenderPass(this._buildDescriptor());
        this._graphicsDevice.currentRenderPass = this;
    }

    /** @inheritDoc */
    public endPass(): void {
        this.gpuRenderPassEncoder.end();
    }


    /** @inheritDoc */
    public pushDebugGroup(label: string): void {
        this.gpuRenderPassEncoder.pushDebugGroup(label);
    }

    /** @inheritDoc */
    public popDebugGroup(): void {
        this.gpuRenderPassEncoder.popDebugGroup();
    }

    /** @inheritDoc */
    public dispose(): void {
        this.gpuRenderPassEncoder = null!;
    }
}
